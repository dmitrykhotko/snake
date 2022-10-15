import { BULLET_SPEED, RESPAWN_DELAY, SNAKE_SPEED } from '../../utils/constants';
import { DamageType, GameStatus, Player } from '../../utils/enums';
import { Action, ArenaActions, ArenaStore, ArenaState, BulletsStore, state, StatActions } from '../redux';
import { Point, ResultWitActions, DirectionWithId, Id, PointWithId } from '../../utils/types';
import { Snakes } from './characters/snakes';
import { Bullets } from './characters/bullets';
import { ArenaStrategy } from './strategies';
import { Hlp } from '../../utils';
import { Stat } from '../stat/stat';

export type ArenaProps = {
	width: number;
	height: number;
	snakeSpeed?: number;
	bulletSpeed?: number;
};

type someFunc = (...params: unknown[]) => unknown;

const defaultProps = {
	snakeSpeed: SNAKE_SPEED,
	bulletSpeed: BULLET_SPEED
};

type DelayedTask = {
	delay: number;
	task: someFunc;
};

export class Arena {
	private width: number;
	private height: number;
	private stepsNum: number;
	private steps!: number;
	private snakeStep: number;
	private bulletStep: number;
	private arenaStrategy?: ArenaStrategy;
	private bulletStrategy?: ArenaStrategy;
	private snakesInitial!: DirectionWithId[];
	private delayedTasks = [] as DelayedTask[];

	constructor(props: ArenaProps) {
		const aProps = { ...defaultProps, ...props };

		({ width: this.width, height: this.height } = aProps);

		const { snakeSpeed, bulletSpeed } = aProps;

		this.stepsNum = Hlp.lcm(snakeSpeed, bulletSpeed);
		this.snakeStep = this.stepsNum / snakeSpeed;
		this.bulletStep = this.stepsNum / bulletSpeed;
	}

	start = (snakesInitial: DirectionWithId[], arenaStrategy?: ArenaStrategy, bulletStrategy?: ArenaStrategy): void => {
		const actions = [this.setCoin(), ArenaActions.setGameStatus(GameStatus.InProgress)];

		this.steps = 0;
		this.snakesInitial = snakesInitial;

		Snakes.init(this.snakesInitial, this.width, this.height);

		this.arenaStrategy = arenaStrategy;
		this.bulletStrategy = bulletStrategy;

		state.dispatch(...actions);
	};

	step = (): void => {
		this.steps++;
		this.runDelayedTasks();

		const moveBullets = !(this.steps % this.bulletStep);
		const moveSnakes = !(this.steps % this.snakeStep);

		moveBullets && this.callIfInProgress(this.moveBullets);
		moveSnakes && this.callIfInProgress(this.moveSnakes);

		this.steps === this.stepsNum && (this.steps = 0);
	};

	private delay = (task: someFunc, delay: number): void => {
		this.delayedTasks.push({
			delay,
			task
		});
	};

	private runDelayedTasks = (): void => {
		const delayedTasks = [] as DelayedTask[];

		for (let i = 0; i < this.delayedTasks.length; i++) {
			const item = this.delayedTasks[i];
			--item.delay ? delayedTasks.push(item) : item.task();
		}

		this.delayedTasks = delayedTasks;
	};

	private callIfInProgress = (callMe: someFunc, ...params: unknown[]): unknown => {
		const { gameStatus } = this.getState();
		return gameStatus === GameStatus.InProgress ? callMe(...params) : undefined;
	};

	private moveBullets = (): void => {
		Bullets.move();

		const { result: victim, actions: hitsActions } = this.checkHits();
		const actions = [...hitsActions];
		const bullets = state.get<BulletsStore>().bullets;

		for (let i = 0; i < bullets.length; i++) {
			const bullet = bullets[i];
			const { id, point } = bullet;
			const coinFoundResult = this.checkCoinFound(point);
			const { result: strategyResult, actions: strategyActions } = this.runStrategy(
				point,
				id,
				this.bulletStrategy
			);

			actions.push(...strategyActions);
			(coinFoundResult || !strategyResult) && actions.push(...Bullets.remove(bullet));
		}

		state.dispatch(...actions);
		victim && this.respawn(victim);
	};

	private moveSnakeMiddleware = (id: Player, head: Point): boolean => {
		const success = this.checkCoinFound(head);

		success && Stat.faceCoin(id);
		return !success;
	};

	private moveSnakes = (): void => {
		Snakes.move(this.moveSnakeMiddleware);

		const actions = [] as Action[];
		const snakes = Snakes.get();
		const victims = [];
		const cutIt = [] as PointWithId[];

		for (let i = 0; i < snakes.length; i++) {
			const { id, head } = snakes[i];
			const { result: ramResult, actions: ramActions } = this.checkRam(id, head);

			if (ramActions.length) {
				cutIt.push(...ramResult);
				victims.push(id);
				actions.push(...ramActions, StatActions.decLives(id));

				continue;
			}

			const { result: strategyResult, actions: strategyActions } = this.runStrategy(head, id, this.arenaStrategy);
			actions.push(...strategyActions);

			if (!strategyResult) {
				victims.push(id);
				actions.push(StatActions.decLives(id));

				continue;
			}
		}

		state.dispatch(...actions, ...Snakes.cut(...cutIt).actions);

		const { result: victim, actions: hitsActions } = this.checkHits();
		state.dispatch(...hitsActions);

		victim && victims.push(victim);
		victims.length && this.respawn(...victims);
	};

	private checkRam = (killer: Player, head: Point): ResultWitActions<PointWithId[]> => {
		const actions = [] as Action[];
		const facedSnake = Snakes.faceObject(head);
		const cutIt = [] as PointWithId[];

		if (!facedSnake) {
			return { result: [], actions: [] };
		}

		const { id: victim, point: facedPoint } = facedSnake;
		let victimDamage = 0;
		let killerDamage = 0;

		if (victim !== killer) {
			cutIt.push({
				id: victim,
				point: facedPoint
			});

			victimDamage = Snakes.len(victim, facedPoint);
			killerDamage = Snakes.len(killer);

			actions.push(
				...Stat.setDamage({ killer, victim, damage: victimDamage - killerDamage }),
				...Stat.setDamage({ killer: victim, victim: killer, damage: killerDamage - victimDamage })
			);
		} else {
			killerDamage = Snakes.len(killer);
			actions.push(...Stat.setDamage({ killer, victim: killer, damage: killerDamage }));
		}

		return { result: cutIt, actions };
	};

	private checkHits = (): ResultWitActions<Player | undefined> => {
		const bullets = state.get<BulletsStore>().bullets;

		for (let i = 0; i < bullets.length; i++) {
			const bullet = bullets[i];
			const { player: killer, point: bulletPoint } = bullet;
			const snakeShotResult = Snakes.faceObject(bulletPoint);

			if (!snakeShotResult) {
				continue;
			}

			const { id: victim } = snakeShotResult;
			const {
				result: { damage, isDead, isHeadShot },
				actions: hitActions
			} = Snakes.hit(snakeShotResult);

			const damageType = isHeadShot ? DamageType.headShot : isDead ? DamageType.death : DamageType.hit;
			const addScoreActions = Stat.setDamage({ killer, victim, damage, damageType, symDamage: true });

			state.dispatch(...Bullets.remove(bullet), ...hitActions, ...addScoreActions);

			if (isDead) {
				const player = snakeShotResult.id;
				return { result: player, actions: [StatActions.decLives(player)] };
			}
		}

		return { result: undefined, actions: [] };
	};

	private runStrategy = (point: Point, id: Id, strategy?: ArenaStrategy): ResultWitActions =>
		strategy ? strategy.run(point, this.width, this.height, id) : { result: true, actions: [] };

	private setCoin = (): Action => {
		const freeCells = this.getFreeCells();
		const coinCellIndex = Hlp.randomInt(freeCells.length);
		const coinCellValue = freeCells[coinCellIndex];
		const x = coinCellValue % this.width;
		const y = (coinCellValue - x) / this.width;

		return ArenaActions.setCoin({ x, y });
	};

	private getState = (): ArenaState => state.get<ArenaStore>().arena;

	private respawn = (...ids: Player[]): void => {
		Snakes.remove(ids);

		this.callIfInProgress(
			this.delay as someFunc,
			() => {
				const snakesInitial = [];

				for (let i = 0; i < ids.length; i++) {
					for (let j = 0; j < this.snakesInitial.length; j++) {
						const item = this.snakesInitial[j];

						if (ids[i] === item.id) {
							snakesInitial.push(item);
						}
					}
				}

				Snakes.init(snakesInitial, this.width, this.height);
			},
			RESPAWN_DELAY
		);
	};

	private getFreeCells = (): number[] => {
		const cells: number[] = [];
		const set = new Set<number>([...Snakes.getSet(this.width), ...Bullets.getSet(this.width)]);

		for (let i = 0; i < this.width * this.height; i++) {
			if (set.has(i)) {
				continue;
			}

			cells.push(i);
		}

		return cells;
	};

	private checkCoinFound = (object: Point): boolean => {
		const success = Hlp.comparePoints(object, this.getState().coin);
		success && state.dispatch(this.setCoin());

		return success;
	};
}
