import { BODY_PART_WEIGHT, FRIENDLY_FIRE_WEIGHT, HEAD_SHOT_WEIGHT } from '../../../utils/constants';
import { nextPointCreator } from '../../../utils/helpers';
import { Bullet, PointWithId, Point, ResultWitActions } from '../../../utils/types';
import { Action, ArenaActions, BinActions, BulletsActions, BulletsStore, SnakesActions, state } from '../../redux';

export abstract class BulletsManager {
	static move = (): void => {
		const collisionActions = [] as Action[];
		const bullets = state.get<BulletsStore>().bullets;

		for (let i = 0; i < bullets.length; i++) {
			const { id, player, point, direction } = bullets[i];
			const nextPoint = nextPointCreator[direction](point);

			point.prev = undefined;
			nextPoint.prev = point;

			const newBullet = { id, player, point: nextPoint, direction };

			state.dispatch(BulletsActions.setBullet(newBullet), BinActions.moveToBin([point]));
			collisionActions.push(...BulletsManager.checkCollision(newBullet));
		}

		state.dispatch(...collisionActions);
	};

	static removeBullet = (bullet: Bullet): Action[] => {
		const { id, point } = bullet;
		const bin = [point];

		point.prev && bin.push(point.prev);

		return [BulletsActions.removeBullet(id), BinActions.moveToBin(bin)];
	};

	static hit = (bullet: Bullet, snakeShotResult: PointWithId): ResultWitActions => {
		const { id: victim, point: snakePoint } = snakeShotResult;
		const { player: shooter } = bullet;
		const bin = [] as Point[];
		const actions = [...BulletsManager.removeBullet(bullet)] as Action[];
		const nextPoint = snakePoint.next;
		const isHeadShot = !nextPoint;
		const isDead = isHeadShot || !nextPoint.next; // it's either head shot or shot the last body piece
		const nextTail = nextPoint || snakePoint;

		let trashPoint: Point | undefined = snakePoint;

		while (trashPoint) {
			bin.push(trashPoint);
			trashPoint = trashPoint.prev;
		}

		nextTail.prev = undefined;
		actions.push(SnakesActions.setTail(nextTail, victim));
		isDead && actions.push(SnakesActions.setHead(nextTail, victim));

		const friendlyFactor = victim === shooter ? -FRIENDLY_FIRE_WEIGHT : 1;
		const scoreDelta = Math.ceil(isHeadShot ? HEAD_SHOT_WEIGHT : bin.length * BODY_PART_WEIGHT * friendlyFactor);

		actions.push(ArenaActions.addCoins(scoreDelta, shooter), BinActions.moveToBin(bin));

		return {
			result: isDead,
			actions
		};
	};

	private static checkCollision = (bullet: Bullet): Action[] => {
		const {
			id,
			point: { x, y }
		} = bullet;
		const actions = [] as Action[];
		const bullets = state.get<BulletsStore>().bullets;
		let result = false;

		for (let i = 0; i < bullets.length; i++) {
			const currBullet = bullets[i];
			const {
				id: currId,
				point: { x: currX, y: currY }
			} = bullets[i];

			if (id === currId || !(x === currX && y === currY)) {
				continue;
			}

			if (!result) {
				actions.push(...BulletsManager.removeBullet(bullet));
				result = true;
			}

			actions.push(...BulletsManager.removeBullet(currBullet));
		}

		return actions;
	};
}
