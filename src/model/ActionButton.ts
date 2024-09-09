import ViewModel from './ViewModel';

/**
 * @deprecated since version 0.4.0
 * Deprecating in favor of ActionButtonV2 to refactor away from
 * tightly coupled pattern (see event-handler/* and documentUtil.findLine())
 */
export class ActionButton implements ViewModel {
	static HTML_CLASS = 'todotxt-action-btn';

	type: ActionType;
	action: string;
	id: string;

	constructor(type: ActionType, action: string, id: string) {
		this.type = type;
		this.action = action;
		this.id = id;
	}
	render(): Element {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.addClass(this.getHtmlCls());
		svg.setAttrs({
			viewBox: '0 0 100 100',
			stroke: 'currentColor',
			'action-type': this.type.name,
			action: this.action,
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
		return ActionButton.HTML_CLASS;
	}
}

export class ActionType {
	// https://www.snoweb-svg.com/
	static EDIT = new ActionType('edit', {
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M61.5,25.9,74,38.5M66.8,20.6A8.9,8.9,0,0,1,79.3,33.2L30.5,82H18.1V69.3Z',
	});

	static DEL = new ActionType('delete', {
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M78.1,29.9,74.6,78.7a8,8,0,0,1-8,7.4H33.4a8,8,0,0,1-8-7.4L21.9,29.9M42,46V70.1M58,46V70.1m4-40.2v-12a4,4,0,0,0-4-4H42a4,4,0,0,0-4,4v12m-20.1,0H82.1',
	});

	static ADD = new ActionType('add', {
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M50,18.8V50m0,0V81.2M50,50H81.2M50,50H18.8',
	});

	static ARCHIVE = new ActionType('archive', {
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M25,35.7H75m-50,0a7.1,7.1,0,0,1,0-14.2H75a7.1,7.1,0,0,1,0,14.2m-50,0V71.4a7.1,7.1,0,0,0,7.2,7.1H67.8A7.1,7.1,0,0,0,75,71.4V35.7M42.9,50H57.1',
	});

	pathAttrs: { [key: string]: string | number | boolean | null };
	name: string;

	constructor(name: string, pathAttrs: { [key: string]: string | number | boolean | null }) {
		this.name = name;
		this.pathAttrs = pathAttrs;
	}
}
