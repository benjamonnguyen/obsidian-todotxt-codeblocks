import { v4 as randomUUID } from 'uuid';
import { moment } from 'obsidian';
import { ActionButton, ActionType, type ViewModel } from '.';
import { EditListOptionsModal } from 'src/component';

export default class LanguageLine implements ViewModel {
	private static REGEX = /^```todotxt(?: "([^"]*)")?/;
	static HTML_CLS = 'todotxt-language-line';
	static TITLE_HTML_CLS = 'todotxt-list-title';
	static LANGUAGE_IDENTIFIER = '```todotxt';
	static SORT_PREFIX = 'sort:';
	static COLLAPSE_PREFIX = 'collapse:';
	static SOURCE_PREFIX = 'src:';
	static STR_ARR_SORT_FIELDS = new Set(['proj', 'ctx', 'default']);
	static ASC_DESC_SORT_FIELDS = new Set(['status', 'prio', 'created', 'completed', 'due']);
	static ALL_SORT_FIELDS = Array.from(LanguageLine.STR_ARR_SORT_FIELDS).concat(
		...LanguageLine.ASC_DESC_SORT_FIELDS,
	);

	private id: string;
	title: string;
	collapsedProjectGroups: Set<string> = new Set();
	sortFieldToOrder: Map<string, string[]> = new Map();
	filterKVs: string[] = [];
	source = '';

	private constructor() {}

	static from(line: string): { langLine: LanguageLine; errors: Error[] } {
		const langLine = new LanguageLine();
		const errs: Error[] = [];

		const match = LanguageLine.REGEX.exec(line);
		if (!match) {
			throw 'Invalid line: ' + line;
		}
		langLine.title = match?.at(1) || `Todo.txt (${moment().format('YYYY-MM-DD')})`;
		langLine.id = randomUUID();

		for (const [, str] of line.split(' ').entries()) {
			if (str.startsWith(LanguageLine.COLLAPSE_PREFIX)) {
				const collapsedProjs = str.substring(LanguageLine.COLLAPSE_PREFIX.length).split(',');
				collapsedProjs.forEach((proj) => {
					if (proj) langLine.collapsedProjectGroups.add(proj);
				});
			} else if (str.startsWith(LanguageLine.SORT_PREFIX)) {
				// Sort ascending by default.
				const res = LanguageLine.handleSort(str);
				if (res instanceof Error) {
					errs.push(res);
				} else {
					langLine.sortFieldToOrder.set(res.field, res.order);
				}
			} else if (str.startsWith(this.SOURCE_PREFIX)) {
				const res = this.extractSource(str);
				if (res instanceof Error) {
					errs.push(res);
				} else {
					langLine.source = res;
				}
			}
			// else if (str.startsWith('filter:')) {
			// this.filterKVs.push(...str.substring(7).split(","));
			// }
		}

		return { langLine, errors: errs };
	}

	render(): HTMLElement {
		const header = document.createElement('span');
		header.addClass(LanguageLine.HTML_CLS);

		const title = document.createElement('h2');
		title.addClass(LanguageLine.TITLE_HTML_CLS);
		title.id = this.id;
		title.setText(this.title);

		header.append(
			title,
			new ActionButton(ActionType.EDIT, EditListOptionsModal.ID, this.id).render(),
		);

		return header;
	}

	toString() {
		const parts = [LanguageLine.LANGUAGE_IDENTIFIER, `"${this.title}"`];
		if (this.sortFieldToOrder.size) {
			parts.push(this.sortOrdersToString());
		}
		if (this.collapsedProjectGroups.size) {
			parts.push(this.collapsedProjectGroupsToString());
		}
		if (this.source) {
			parts.push(LanguageLine.SOURCE_PREFIX + this.source);
		}

		return parts.join(' ');
	}

	sortOrdersToString(): string {
		const sortOrders: string[] = [];
		for (const [field, order] of this.sortFieldToOrder.entries()) {
			let res = LanguageLine.SORT_PREFIX + field;
			if (order.length) {
				res += ':' + order.join(',');
			}
			sortOrders.push(res);
		}

		return sortOrders.join(' ');
	}

	collapsedProjectGroupsToString(): string {
		return this.collapsedProjectGroups.size
			? LanguageLine.COLLAPSE_PREFIX + Array.from(this.collapsedProjectGroups).join(',')
			: '';
	}

	getId(): string {
		return this.id;
	}

	getHtmlCls(): string {
		return LanguageLine.HTML_CLS;
	}

	static handleSort(str: string): { field: string; order: string[] } | Error {
		const segs = Array.from(str.match(/([^:\n\s]+):([^:\n\s]+)(?::([^:\n\s]+))?/)?.values() || []);
		const field = segs.at(2);
		const order = segs.at(3)?.split(',');
		if (!field) {
			return new SyntaxError(`"${str}" does not follow syntax "sort:<field>:<order?>"`);
		}
		if (
			!LanguageLine.ASC_DESC_SORT_FIELDS.has(field) &&
			!LanguageLine.STR_ARR_SORT_FIELDS.has(field)
		) {
			return new SyntaxError(
				`"${field}" is not a valid sort field (${LanguageLine.ALL_SORT_FIELDS.join(', ')})`,
			);
		}
		if (field === 'default') {
			if (order) order.length = 0;
		} else if (LanguageLine.ASC_DESC_SORT_FIELDS.has(field)) {
			const orderStr = segs.at(3);
			if (orderStr && orderStr !== 'asc' && orderStr !== 'desc') {
				return new SyntaxError(`${field} order must be "asc" or "desc" (defaults to "asc")`);
			}
		}

		return { field, order: order?.filter((o) => o.length) || [] };
	}

	static extractSource(str: string): string | Error {
		const parts = str.split(':');
		if (parts.length != 2 || !parts[1].endsWith('.txt')) {
			return new SyntaxError(`"${str}" does not follow syntax "src:<path/to/*.txt">`);
		}

		return parts[1];
	}
}
