import { ActionType } from './ActionButton';
import ViewModel from './ViewModel';

export class ActionButtonV2 implements ViewModel {
	static HTML_CLASS = 'todotxt-action-btn';

	type: ActionType;
	id: string;

	constructor(type: ActionType, id: string) {
		this.type = type;
		this.id = id;
	}
	render(): Element {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.addClass(this.getHtmlCls());
		svg.setAttrs({
			viewBox: '0 0 100 100',
			stroke: 'currentColor',
			'action-type': this.type.name,
			'target-id': this.id,
		});
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttrs(this.type.pathAttrs);
		svg.appendChild(path);

		return svg;
	}
	getId(): string | undefined {
		throw new Error('Method not implemented.');
	}
	getHtmlCls(): string {
		return ActionButtonV2.HTML_CLASS;
	}
}