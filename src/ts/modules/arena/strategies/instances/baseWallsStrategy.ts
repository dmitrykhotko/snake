import { Id, Point, ResultWitActions } from '../../../../utils/types';
import { Action } from '../../../redux';
import { ArenaStrategy } from '../arenaStrategy';

export enum Position {
	Top,
	Left,
	Bottom,
	Right
}

export abstract class BaseWallsStrategy extends ArenaStrategy {
	run = (point: Point, width: number, height: number, id?: number): ResultWitActions => {
		const position = this.getPosition(point, width, height);

		return {
			result: true,
			actions: id && position !== undefined ? this.applyPosition(point, width, height, id, position) : []
		};
	};

	private getPosition = (point: Point, width: number, height: number): Position | undefined => {
		const { x, y } = point;

		let pos: Position;

		if (!!~x && !!~y && x !== width && y !== height) {
			return undefined;
		}

		if (!~x) {
			pos = Position.Left;
		} else if (x === width) {
			pos = Position.Right;
		} else if (!~y) {
			pos = Position.Top;
		} else {
			pos = Position.Bottom;
		}

		return pos;
	};

	protected abstract applyPosition(point: Point, width: number, height: number, id: Id, position: Position): Action[];
}
