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

	get htmlCls(): string {
		return ActionButton.HTML_CLASS;
	}

	render(): Element {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.addClass(this.htmlCls);
		svg.setAttrs({
			viewBox: this.type.viewBox,
			stroke: 'currentColor',
			'action-type': this.type.name,
			action: this.action,
			'target-id': this.id,
		});
		this.type.pathAttrs.forEach(attrs => {
			const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttrs(attrs);
			svg.appendChild(path);
		});

		return svg;
	}
}

export class ActionType {
	// https://www.snoweb-svg.com/
	static SETTINGS = new ActionType('settings', [
		{
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
			d: 'M44,22.6a6.2,6.2,0,0,1,12,0,6.2,6.2,0,0,0,9.2,3.8,6.1,6.1,0,0,1,8.4,8.4A6.2,6.2,0,0,0,77.4,44a6.2,6.2,0,0,1,0,12,6.2,6.2,0,0,0-3.8,9.2,6.1,6.1,0,0,1-8.4,8.4A6.2,6.2,0,0,0,56,77.4a6.2,6.2,0,0,1-12,0,6.2,6.2,0,0,0-9.2-3.8,6.1,6.1,0,0,1-8.4-8.4A6.2,6.2,0,0,0,22.6,56a6.2,6.2,0,0,1,0-12,6.2,6.2,0,0,0,3.8-9.2,6.1,6.1,0,0,1,8.4-8.4A6.2,6.2,0,0,0,44,22.6Z',
		},
		{
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
			d: 'M60.7,50A10.7,10.7,0,1,1,50,39.3,10.7,10.7,0,0,1,60.7,50Z',
		}
	]);

	static STAR = new ActionType('star', [{
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M46.9,23A3.3,3.3,0,0,1,51,20.9,3.4,3.4,0,0,1,53.1,23l5,15.4a3.2,3.2,0,0,0,3.1,2.2H77.3a3.2,3.2,0,0,1,3.2,3.3,3.3,3.3,0,0,1-1.3,2.6L66.2,56A3.3,3.3,0,0,0,65,59.6l4.9,15.3A3.3,3.3,0,0,1,67.7,79a3.2,3.2,0,0,1-2.8-.5l-13-9.4a3,3,0,0,0-3.8,0l-13,9.4a3.3,3.3,0,0,1-4.6-.8,3.4,3.4,0,0,1-.4-2.8L35,59.6A3.3,3.3,0,0,0,33.8,56l-13-9.5a3.4,3.4,0,0,1-.7-4.6,3.3,3.3,0,0,1,2.6-1.3H38.8a3.2,3.2,0,0,0,3.1-2.2Z',
	}],
		'7 7 86 86',
	);

	static EDIT = new ActionType('edit', [{
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M61.5,25.9,74,38.5M66.8,20.6A8.9,8.9,0,0,1,79.3,33.2L30.5,82H18.1V69.3Z',
	}]);

	static DEL = new ActionType('delete', [{
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M78.1,29.9,74.6,78.7a8,8,0,0,1-8,7.4H33.4a8,8,0,0,1-8-7.4L21.9,29.9M42,46V70.1M58,46V70.1m4-40.2v-12a4,4,0,0,0-4-4H42a4,4,0,0,0-4,4v12m-20.1,0H82.1',
	}]);

	static ADD = new ActionType('add', [{
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M50,18.8V50m0,0V81.2M50,50H81.2M50,50H18.8',
	}]);

	static ARCHIVE = new ActionType('archive', [{
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		d: 'M25,35.7H75m-50,0a7.1,7.1,0,0,1,0-14.2H75a7.1,7.1,0,0,1,0,14.2m-50,0V71.4a7.1,7.1,0,0,0,7.2,7.1H67.8A7.1,7.1,0,0,0,75,71.4V35.7M42.9,50H57.1',
	}]);

	pathAttrs: { [key: string]: string | number | boolean | null }[];
	name: string;
	viewBox: string;

	constructor(
		name: string,
		pathAttrs: { [key: string]: string | number | boolean | null }[],
		viewBox: string = '0 0 100 100',
	) {
		this.name = name;
		this.pathAttrs = pathAttrs;
		this.viewBox = viewBox;
	}
}
