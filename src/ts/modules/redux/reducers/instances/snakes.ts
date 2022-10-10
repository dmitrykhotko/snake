import { RESET_GAME, NEW_DIRECTION, SET_HEAD, SET_SNAKE, SET_TAIL } from '../../../../utils/constants';
import { Direction, Player } from '../../../../utils/enums';
import { Action, SetValueAction, SetValueByIdAction } from '../..';
import { Store } from '../../state';
import { Reducer } from '../reducer';
import { Point, SnakeData } from '../../../../utils/types';
import { filterById, getById } from '../../../../utils/helpers';

export type SnakeState = SnakeData & { newDirection?: Direction };

export type SnakesStore = {
	snakes: SnakeState[];
};

const initialState = {
	snakes: []
} as SnakesStore;

const setProperty = <T extends Point | Direction>(
	state: Store,
	action: Action,
	pName: keyof SnakeState
): SnakesStore => {
	const snakesState = state as SnakesStore;
	const { id, value } = action as SetValueByIdAction<T, Player>;
	const targetSnake = getById(id, snakesState.snakes);

	return {
		...snakesState,
		snakes: [...filterById(id, snakesState.snakes), { ...targetSnake, ...{ [pName]: value } }]
	};
};

const setSnake = (state: Store, action: Action): SnakesStore => {
	const snakesState = state as SnakesStore;
	const { value } = action as SetValueAction<SnakeData>;

	return {
		...snakesState,
		snakes: [...filterById(value.id, snakesState.snakes), value]
	};
};

export abstract class SnakesReducer extends Reducer<SnakesStore> {
	static getInitialState = (): SnakesStore => initialState;

	static reduce = (state: Store, action: Action): Store => {
		let propName: string;
		const { type } = action;

		switch (type) {
			case SET_SNAKE:
				return setSnake(state, action);
			case SET_HEAD:
				propName = 'head';
				break;
			case SET_TAIL:
				propName = 'tail';
				break;
			case NEW_DIRECTION:
				propName = 'newDirection';
				break;
			case RESET_GAME:
				return { ...state, ...initialState };
			default:
				return state;
		}

		return setProperty(state, action, propName as keyof SnakeState);
	};
}
