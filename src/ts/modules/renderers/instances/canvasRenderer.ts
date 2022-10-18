import { CELL_SIZE, CIRCLE_RADIUS_CELLS, LINE_HEIGHT } from '../../../utils/constants';
import { DrawGrid, DrawingObject, KeyCode, Layer } from '../../../utils/enums';
import { Point, Size } from '../../../utils/types';
import { BaseRenderer } from './baseRenderer';

const colors = {
	[DrawingObject.Empty]: '#191970',
	[DrawingObject.Head1]: '#DEB887',
	[DrawingObject.Head2]: '#00FF7F',
	[DrawingObject.Body]: '#E67E22',
	[DrawingObject.Coin]: '#FFFF00',
	[DrawingObject.Grid]: '#758384',
	[DrawingObject.Bullet]: '#ff3300',
	[DrawingObject.ServiceArea]: 'yellow'
};

const defaultProps = {
	drawGrid: DrawGrid.No,
	cellSize: CELL_SIZE,
	lineHeight: LINE_HEIGHT
};

export type CanvasRendererProps = {
	presenterEl: HTMLCanvasElement;
	statEl: HTMLCanvasElement;
	serviceEl: HTMLCanvasElement;
	drawGrid?: DrawGrid;
	size: Size;
	cellSize?: number;
	lineHeight?: number;
};

export class CanvasRenderer extends BaseRenderer {
	private presenterEl: HTMLCanvasElement;
	private presenterLayer!: CanvasRenderingContext2D;
	private statEl: HTMLCanvasElement;
	private statLayer!: CanvasRenderingContext2D;
	private serviceEl: HTMLCanvasElement;
	private serviceLayer!: CanvasRenderingContext2D;
	private cellSize: number;
	private lineHeight: number;

	private activeLayer = this.presenterLayer;
	private layers!: Record<Layer, CanvasRenderingContext2D>;

	constructor(props: CanvasRendererProps) {
		const cProps = { ...defaultProps, ...props };
		const { size } = cProps;

		super(size);

		({
			presenterEl: this.presenterEl,
			statEl: this.statEl,
			serviceEl: this.serviceEl,
			drawGrid: this.drawGrid,
			cellSize: this.cellSize,
			lineHeight: this.lineHeight
		} = cProps);

		this.init();
	}

	focus = (): void => {
		this.presenterEl.focus();
	};

	protected use = (layer: Layer): BaseRenderer => {
		this.activeLayer = this.layers[layer];
		return this;
	};

	protected renderRect = ({ x, y }: Point, w: number, h: number, type: DrawingObject): void => {
		this.activeLayer.fillStyle = colors[type];
		this.activeLayer.fillRect(x, y, w * this.cellSize, h * this.cellSize);
	};

	protected renderCell = (point: Point, type: DrawingObject): void => {
		const { x, y } = this.weightPoint(point);

		if (type !== DrawingObject.Empty) {
			this.activeLayer.fillStyle = colors[type];
			this.activeLayer.fillRect(x, y, this.cellSize, this.cellSize);
		} else {
			this.activeLayer.fillStyle = colors[type];
			this.activeLayer.fillRect(x, y, this.cellSize, this.cellSize);

			if (this.drawGrid === DrawGrid.Yes) {
				this.activeLayer.strokeStyle = colors[DrawingObject.Grid];
				this.activeLayer.strokeRect(x, y, this.cellSize, this.cellSize);
			}
		}
	};

	protected clearRect = (point = { x: 0, y: 0 }, size?: Size): void => {
		const { x, y } = this.weightPoint(point);
		const { width, height } = size ? this.weightSize(size) : this.activeLayer.canvas;

		this.activeLayer.clearRect(x, y, width, height);
	};

	protected clearCell = (point: Point): void => {
		this.clearRect(point, { width: 1, height: 1 });
	};

	protected renderCircle = (
		point: Point,
		type: DrawingObject,
		radius = CIRCLE_RADIUS_CELLS,
		fitToCell = true
	): void => {
		const cRadius = radius * this.cellSize;
		const { x, y } = this.weightPoint(point, fitToCell ? cRadius : 0);

		this.activeLayer.fillStyle = colors[type];
		this.activeLayer.beginPath();
		this.activeLayer.arc(x, y, cRadius, 0, 2 * Math.PI);
		this.activeLayer.fill();
	};

	protected renderTextLine = (text: string, lineNumber: number): void => {
		this.activeLayer.fillStyle = '#FFFFFF';
		this.activeLayer.font = `700 ${this.lineHeight * 0.75}px Verdana`;
		this.activeLayer.fillText(text, this.cellSize, this.lineHeight * lineNumber);
	};

	protected renderText = (text: string, point: Point, lineHeight: number, type: DrawingObject): void => {
		const { x, y } = this.weightPoint(point);

		this.activeLayer.fillStyle = colors[type];
		this.activeLayer.font = `700 ${lineHeight}px Verdana`;
		this.activeLayer.fillText(text, x, y);
	};

	protected measureText = (text: string, lineHeight: number): number => {
		this.activeLayer.font = `700 ${lineHeight}px Verdana`;
		return this.activeLayer.measureText(text).width / this.cellSize;
	};

	protected drawHeart = (point: Point, size: Size, type: DrawingObject): void => {
		const { width, height } = this.weightSize(size);
		const { x, y } = this.weightPoint(point);
		const topCurveHeight = height * 0.3;

		this.activeLayer.save();
		this.activeLayer.beginPath();
		this.activeLayer.moveTo(x, y + topCurveHeight);
		// top left curve
		this.activeLayer.bezierCurveTo(x, y, x - width / 2, y, x - width / 2, y + topCurveHeight);

		// bottom left curve
		this.activeLayer.bezierCurveTo(
			x - width / 2,
			y + (height + topCurveHeight) / 2,
			x,
			y + (height + topCurveHeight) / 2,
			x,
			y + height
		);

		// bottom right curve
		this.activeLayer.bezierCurveTo(
			x,
			y + (height + topCurveHeight) / 2,
			x + width / 2,
			y + (height + topCurveHeight) / 2,
			x + width / 2,
			y + topCurveHeight
		);

		// top right curve
		this.activeLayer.bezierCurveTo(x + width / 2, y, x, y, x, y + topCurveHeight);

		this.activeLayer.closePath();
		this.activeLayer.fillStyle = colors[type];
		this.activeLayer.fill();
		this.activeLayer.restore();
	};

	protected drawLive = (point: Point, { width, height }: Size, type: DrawingObject, factor = 1): void => {
		const fSize = { width: width * factor, height: height * factor };
		const radius = CIRCLE_RADIUS_CELLS * factor;

		this.drawHeart(point, fSize, type);
		this.renderCircle(point, DrawingObject.Empty, radius);
		this.renderCircle({ x: point.x - factor, y: point.y }, DrawingObject.Empty, radius);
		this.renderCircle({ x: point.x, y: point.y + factor }, DrawingObject.Bullet, radius);
		this.renderCircle({ x: point.x - factor, y: point.y + factor }, DrawingObject.Bullet, radius);
	};

	// make a single weight method
	private weightPoint = ({ x, y }: Point, extra = 0): Point => ({
		x: x * this.cellSize + extra,
		y: y * this.cellSize + extra
	});

	private weightSize = ({ width, height }: Size, extra = 0): Size => ({
		width: width * this.cellSize + extra,
		height: height * this.cellSize + extra
	});

	private init = (): void => {
		const size = this.weightSize(this.size);
		const dpr = window.devicePixelRatio;
		const { height: statElHeight } = this.statEl.getBoundingClientRect();
		const { width: serviceElWidth } = this.serviceEl.getBoundingClientRect();
		const presenterLayer = this.initCanvas(this.presenterEl, size);
		const statLayer = this.initCanvas(this.statEl, { width: size.width, height: statElHeight * dpr });
		const serviceLayer = this.initCanvas(this.serviceEl, { width: serviceElWidth * dpr, height: size.height });

		if (!(presenterLayer && serviceLayer && statLayer)) {
			return;
		}

		this.presenterLayer = presenterLayer;
		this.statLayer = statLayer;
		this.serviceLayer = serviceLayer;

		this.layers = {
			[Layer.Presenter]: this.presenterLayer,
			[Layer.Stat]: this.statLayer,
			[Layer.Service]: this.serviceLayer
		};

		this.presenterEl.addEventListener('keydown', this.onKeyDown);
	};

	private initCanvas = (
		canvas: HTMLCanvasElement,
		{ width, height }: Size,
		alpha = true
	): CanvasRenderingContext2D | null => {
		const ctx = canvas.getContext('2d', { alpha });

		canvas.width = width;
		canvas.height = height;

		return ctx;
	};

	private onKeyDown = (event: KeyboardEvent): void => {
		const playerInput = +KeyCode[event.code as unknown as KeyCode];

		if (!playerInput) {
			return;
		}

		event.preventDefault();
		this.input(playerInput);
	};
}
