import { EditorView } from '@codemirror/view';
import { TodoItem, ProjectGroupContainer, ActionButton, ActionType } from '.';
import { v4 as randomUUID } from 'uuid';
import { LanguageLine } from '.';
import type { ViewModel } from '.';
import { AddItemModal } from 'src/component';
import { moment } from 'obsidian';
import { ExtensionType } from 'src/extension';
import { SETTINGS_READ_ONLY } from 'src/main';

export default class TodoList implements ViewModel {
	// "n/c" will respresent order for items with no context (ex. sort:ctx:a,b,n/c,c)
	private static NO_CONTEXT = 'n/c';
	static HTML_CLS = 'todotxt-list';

	private id: string;
	#langLine: LanguageLine;
	#items: TodoItem[];
	#projectGroups: ProjectGroupContainer[];
	#orderedContexts: string[];

	constructor(langLine: LanguageLine, items: TodoItem[]) {
		this.id = `list-${randomUUID()}`;
		this.setLanguageLine(langLine);
		this.#items = items;
		this.#projectGroups = this.buildProjectGroups();
		this.#orderedContexts = this.getContextOrder(this.#langLine.sortFieldToOrder.get('ctx'));
	}

	static from(
		lineNumber: number,
		view: EditorView,
	): { todoList: TodoList; from: number; to: number; errors: Error[] } {
		let i = lineNumber;
		const firstLine = view.state.doc.line(i++);
		const { langLine, errors } = LanguageLine.from(firstLine.text);

		let to: number = firstLine.to;
		const items: TodoItem[] = [];
		while (i < view.state.doc.lines) {
			const line = view.state.doc.line(i++);
			if (line.text.startsWith('```')) break;
			to = line.to;
			if (line.text.trim()) {
				items.push(new TodoItem(line.text));
			}
		}

		return {
			todoList: new TodoList(langLine, items),
			from: firstLine.from,
			to,
			errors,
		};
	}

	render(): HTMLElement {
		const list = document.createElement('div');
		list.addClass(this.getHtmlCls());
		list.id = this.id;

		const actions = list.createSpan({
			cls: 'todotxt-list-actions',
		});
		actions.append(new ActionButton(ActionType.ADD, AddItemModal.ID, list.id).render());
		if (SETTINGS_READ_ONLY.archiveBehavior === 'archive') {
			actions.append(
				new ActionButton(ActionType.ARCHIVE, 'todotxt-archive-items', list.id).render(),
			);
		} else if (SETTINGS_READ_ONLY.archiveBehavior === 'delete') {
			actions.append(new ActionButton(ActionType.DEL, 'todotxt-delete-items', list.id).render());
		}
		list.appendChild(this.#langLine.render());

		this.#items
			.filter((item) => !item.projects().length)
			.forEach((item) => list.append(item.render()));

		this.#projectGroups.forEach((projGroup) => list.appendChild(projGroup.render()));

		return list;
	}

	getId(): string {
		return this.id;
	}

	getHtmlCls(): string {
		return TodoList.HTML_CLS;
	}

	toString(): string {
		let res = this.#langLine.toString() + '\n';
		res += this.#items.map((item) => item.toString()).join('\n');

		return res;
	}

	items(): TodoItem[] {
		return [...this.#items];
	}

	removeItems(predicate: (item: TodoItem) => boolean): TodoItem[] {
		const removedItems: TodoItem[] = [];
		const keptItems: TodoItem[] = [];
		this.#items.forEach((item) => {
			if (predicate(item)) {
				removedItems.push(item);
			} else {
				keptItems.push(item);
			}
		});
		this.#items = keptItems;
		this.#projectGroups = this.buildProjectGroups();

		return removedItems;
	}

	add(item: TodoItem) {
		this.#items.push(item);
		item.projects().forEach((proj) => {
			let found = false;
			for (const group of this.#projectGroups) {
				if (group.name === proj) {
					group.items.push(item);
					found = true;
					break;
				}
			}
			if (!found) {
				this.#projectGroups.push(
					new ProjectGroupContainer(proj, [item], this.#langLine.collapsedProjectGroups.has(proj)),
				);
			}
		});
		this.sort();
	}

	edit(itemIdx: number, newItem: TodoItem) {
		const currItem = this.#items.at(itemIdx);
		if (currItem) {
			this.#items[itemIdx] = newItem;
		}
		this.sort();
	}

	languageLine(): LanguageLine {
		return this.#langLine;
	}

	setLanguageLine(langLine: LanguageLine) {
		// @ts-ignore
		this.#langLine = Object.freeze(langLine);
	}

	projectGroups(): ProjectGroupContainer[] {
		return [...this.#projectGroups];
	}

	orderedContexts(): string[] {
		return [...this.#orderedContexts];
	}

	sort() {
		const ASC = 'asc';
		const sortDefaultOptions = getSortDefaultOptions(this.#langLine.sortFieldToOrder);

		const createdSortOrder =
			this.#langLine.sortFieldToOrder.get('created') || sortDefaultOptions.has('created')
				? []
				: undefined;
		if (createdSortOrder) {
			this.#items.sort((a, b) => {
				const aDate = moment(a.created());
				const bDate = moment(b.created());

				if (!createdSortOrder.length || createdSortOrder.first()! === ASC) {
					return aDate.diff(bDate, 'd');
				}
				return bDate.diff(aDate, 'd');
			});
		}
		// console.log("createdOrder", this.items.map(item => item.body()));

		const ctxSortOrder =
			this.#langLine.sortFieldToOrder.get('ctx') || sortDefaultOptions.has('ctx') ? [] : undefined;
		this.#orderedContexts = this.getContextOrder(ctxSortOrder);
		if (ctxSortOrder) {
			this.#items.sort((a, b) => {
				let aScore = Number.MAX_VALUE;
				if (a.contexts().length) {
					a.contexts().forEach(
						(ctx) => (aScore = Math.min(this.#orderedContexts.indexOf(ctx), aScore)),
					);
				} else if (this.#orderedContexts.indexOf(TodoList.NO_CONTEXT) !== -1) {
					aScore = Math.min(this.#orderedContexts.indexOf(TodoList.NO_CONTEXT), aScore);
				}

				let bScore = Number.MAX_VALUE;
				if (b.contexts().length) {
					b.contexts().forEach(
						(ctx) => (bScore = Math.min(this.#orderedContexts.indexOf(ctx), bScore)),
					);
				} else if (this.#orderedContexts.indexOf(TodoList.NO_CONTEXT) !== -1) {
					bScore = Math.min(this.#orderedContexts.indexOf(TodoList.NO_CONTEXT), bScore);
				}

				return aScore - bScore;
			});
		}
		// console.log("ctxOrder", this.items.map(item => item.body()));

		const dueSortOrder =
			this.#langLine.sortFieldToOrder.get('due') || sortDefaultOptions.has('due') ? [] : undefined;
		if (dueSortOrder) {
			this.#items.sort((a, b) => {
				const aDueExtValue = a.getExtensionValuesAndBodyIndices(ExtensionType.DUE).first()?.value;
				const bDueExtValue = b.getExtensionValuesAndBodyIndices(ExtensionType.DUE).first()?.value;
				const aDate = aDueExtValue ? moment(aDueExtValue) : moment(new Date(8640000000000000));
				const bDate = bDueExtValue ? moment(bDueExtValue) : moment(new Date(8640000000000000));

				if (!dueSortOrder.length || dueSortOrder.first()! === ASC) {
					return aDate.diff(bDate, 'd');
				}
				return bDate.diff(aDate, 'd');
			});
		}
		// console.log("dueOrder", this.items.map(item => item.body()));

		const prioritySortOrder =
			this.#langLine.sortFieldToOrder.get('prio') || sortDefaultOptions.has('prio')
				? []
				: undefined;
		if (prioritySortOrder) {
			this.#items.sort((a, b) => {
				const aScore = a.priority()?.charCodeAt(0) || Number.MAX_VALUE;
				const bScore = b.priority()?.charCodeAt(0) || Number.MAX_VALUE;
				if (!prioritySortOrder.length || prioritySortOrder.first()! === ASC) {
					return aScore - bScore;
				}
				return bScore - aScore;
			});
		}
		// console.log("prioOrder", this.items.map(item => item.body()));

		const completedSortOrder =
			this.#langLine.sortFieldToOrder.get('completed') || sortDefaultOptions.has('completed')
				? []
				: undefined;
		if (completedSortOrder) {
			this.#items.sort((a, b) => {
				const aDate = moment(a.completed());
				const bDate = moment(b.completed());

				if (!completedSortOrder.length || completedSortOrder.first()! === ASC) {
					return aDate.diff(bDate, 'd');
				}
				return bDate.diff(aDate, 'd');
			});
		}
		// console.log("completedOrder", this.items.map(item => item.body()));

		const statusSortOrder =
			this.#langLine.sortFieldToOrder.get('status') || sortDefaultOptions.has('status')
				? []
				: undefined;
		if (statusSortOrder) {
			this.#items.sort((a, b) => {
				const aScore = a.complete() ? 1 : 0;
				const bScore = b.complete() ? 1 : 0;
				if (!statusSortOrder.length || statusSortOrder.first()! === ASC) {
					return aScore - bScore;
				}
				return bScore - aScore;
			});
		}
		// console.log("statusOrder", this.items.map(item => item.body()));

		const projectOrder = this.getProjectOrder(
			this.#items,
			this.#langLine.sortFieldToOrder.get('proj'),
		);
		this.#projectGroups.sort((a, b) => {
			let aScore = projectOrder.findIndex((proj) => proj === a.name);
			let bScore = projectOrder.findIndex((proj) => proj === b.name);

			if (statusSortOrder) {
				if (a.isCompleted) aScore += this.#projectGroups.length;
				if (b.isCompleted) bScore += this.#projectGroups.length;
			}

			return aScore - bScore;
		});
		this.#items.sort((a, b) => {
			let aScore: number | undefined;
			let bScore: number | undefined;
			a.projects().forEach(
				(proj) =>
					(aScore = Math.min(
						this.#projectGroups.findIndex((group) => group.name === proj),
						aScore === undefined ? Number.MAX_VALUE : aScore,
					)),
			);
			b.projects().forEach(
				(proj) =>
					(bScore = Math.min(
						this.#projectGroups.findIndex((group) => group.name === proj),
						bScore === undefined ? Number.MAX_VALUE : bScore,
					)),
			);

			return (aScore || -1) - (bScore || -1);
		});
		// console.log("projOrder", this.items.map(item => item.body()));

		for (const [i, item] of this.#items.entries()) {
			item.setIdx(i);
		}
	}

	private buildProjectGroups(): ProjectGroupContainer[] {
		const nameToProjectGroup: Map<string, ProjectGroupContainer> = new Map();
		this.#items.forEach((item) => {
			item.projects().forEach((proj) => {
				const group = nameToProjectGroup.get(proj);
				if (group) {
					group.items.push(item);
				} else {
					nameToProjectGroup.set(
						proj,
						new ProjectGroupContainer(
							proj,
							[item],
							this.#langLine.collapsedProjectGroups.has(proj),
						),
					);
				}
			});
		});

		return Array.from(nameToProjectGroup.values());
	}

	private getProjectOrder(items: TodoItem[], projSortOrder: string[] | undefined): string[] {
		if (!items) throw 'Invalid args!';

		// Get existing projects
		const projects: Set<string> = new Set();
		items.forEach((item) => item.projects().forEach((proj) => projects.add(proj)));

		// Filter out nonexistent projects from projectOrder
		const projectOrder = projSortOrder
			? [...projSortOrder.filter((proj) => projects.has(proj))]
			: [];

		// Append projects without sort order in alphabetical order
		const remainingProjects: string[] = Array.from(projects)
			.filter((proj) => !projectOrder.contains(proj))
			.sort();

		return projectOrder.concat(remainingProjects);
	}

	private getContextOrder(ctxSortOrder: string[] | undefined): string[] {
		// Get existing contexts
		const contexts: Set<string> = new Set();
		this.#items.forEach((item) => item.contexts().forEach((ctx) => contexts.add(ctx)));

		// Filter out nonexistent contexts
		const contextOrder = ctxSortOrder
			? [...ctxSortOrder.filter((ctx) => contexts.has(ctx) || ctx === TodoList.NO_CONTEXT)]
			: [];

		// Append contexts without sort order in alphabetical order
		const remainingContexts: string[] = Array.from(contexts)
			.filter((ctx) => !contextOrder.contains(ctx))
			.sort();

		return contextOrder.concat(remainingContexts);
	}
}

function getSortDefaultOptions(sortFieldToOrder: Map<string, string[]>): Set<string> {
	const sortDefaultOptions: Set<string> = new Set();
	if (
		sortFieldToOrder.get('default') ||
		(SETTINGS_READ_ONLY.applySortDefault && !sortFieldToOrder.size)
	) {
		const invalidOptions: string[] = [];
		for (let opt of SETTINGS_READ_ONLY.sortDefaultOptions.split(',')) {
			opt = opt.trimStart(); // in case user adds space after commas
			const res = LanguageLine.handleSort('sort:' + opt);
			if (res instanceof Error) {
				invalidOptions.push(opt);
			} else {
				sortDefaultOptions.add(opt);
			}
		}
		if (invalidOptions.length) {
			console.error('Invalid "sort:default" options: ' + invalidOptions);
		}
	}

	return sortDefaultOptions;
}
