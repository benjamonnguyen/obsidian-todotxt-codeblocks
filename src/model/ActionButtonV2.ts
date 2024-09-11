import { ActionType } from './ActionButton';
import ViewModel from './ViewModel';

export class ActionButtonV2 implements ViewModel {
	static HTML_CLASS = 'todotxt-action-btn';

	type: ActionType;
	clickHandler: (e: MouseEvent) => any;

	constructor(type: ActionType, clickHandler: (e: MouseEvent) => any) {
		this.type = type;
		this.clickHandler = clickHandler;
	}
	render(): Element {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.addClass(this.htmlCls);
		svg.setAttrs({
			viewBox: this.type.viewBox,
			stroke: 'currentColor',
			'action-type': this.type.name,
			'target-id': this.id,
		});
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttrs(this.type.pathAttrs);
		svg.appendChild(path);

		svg.addEventListener('click', this.clickHandler);

		return svg;
	}

	get id(): null {
		return null;
	}

	get htmlCls(): string {
		return ActionButtonV2.HTML_CLASS;
	}
}