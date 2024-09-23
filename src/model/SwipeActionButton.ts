import { ActionType } from './ActionButton';
import ViewModel from './ViewModel';

export class SwipeActionButton implements ViewModel {
	static HTML_CLASS = 'todotxt-swipe-action';

	private text: string;
	private type: ActionType;
	private clickHandler: (e: MouseEvent) => any;

	constructor(type: ActionType, text: string, clickHandler: (e: MouseEvent) => any) {
		this.text = text;
		this.type = type;
		this.clickHandler = clickHandler;
	}
	render(): HTMLElement {
		const div = document.createElement('div');
		div.addClasses([this.htmlCls, this.type.name]);
		div.setText(this.text);

		// const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		// svg.addClass(this.htmlCls, this.type.name);
		// svg.setAttrs({
		// 	viewBox: this.type.viewBox,
		// 	stroke: 'currentColor',
		// });
		// this.type.pathAttrs.forEach(attrs => {
		// 	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		// 	path.setAttrs(attrs);
		// 	svg.appendChild(path);
		// });
		// div.append(svg);

		// div.createSpan().setText(this.text);
		div.addEventListener('click', this.clickHandler);

		return div;
	}

	get id(): null {
		return null;
	}

	get htmlCls(): string {
		return SwipeActionButton.HTML_CLASS;
	}
}