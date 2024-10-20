import { v4 as randomUUID } from 'uuid';
import { ActionType, TodoList, type ViewModel } from '.';
import { Item } from './Item';
import { EditItemModal } from 'src/component';
import { moment } from 'obsidian';
import { processExtensions, ExtensionType } from 'src/extension';
import { update, updateTodoItemFromEl } from 'src/stateEditor';
import { ActionButtonV2 } from './ActionButtonV2';
import { DEFAULT_SETTINGS } from 'src/settings';
import { SETTINGS_READ_ONLY } from 'src/main';
import { SwipeActionButton } from './SwipeActionButton';
import { calculateDate } from 'src/dateUtil';
import { notice, Level } from 'src/notice';

export default class TodoItem extends Item implements ViewModel {
	static HTML_CLS = 'todotxt-item';
	static ID_REGEX = /^item-\S+-(\d+)$/;

	#id: string;

	lastTap = 0;
	startTime = 0;
	startX = 0;
	startY = 0;

	constructor(text: string) {
		super(text);
	}

	get htmlCls(): string {
		return TodoItem.HTML_CLS;
	}

	setBody(body: string): void {
		super.setBody(body);
		processExtensions(this);
		if (!this.created()) {
			this.setCreated(new Date());
		}
	}

	render(): HTMLElement {
		if (!this.#id) throw 'No id!';

		const itemDiv = document.createElement('div');
		itemDiv.addClass(this.getHtmlCls());
		itemDiv.id = this.#id;
		if (this.complete()) {
			itemDiv.setAttr('checked', true);
		}

		const row = itemDiv.createEl('div', {
			cls: 'todotxt-item-row',
		});

		this.buildCheckbox(row);

		const prio = this.priority();
		if (prio && !this.complete()) {
			row.append(this.buildPriorityDropDownBadgeHtml());
		}

		const content = row.createEl('span', {
			cls: 'todotxt-item-content',
		});
		const description = this.buildDescriptionHtml();
		content.append(description);
		// @ts-ignore
		if (app.isMobile) {
			content.addEventListener('touchstart', (e) => {
				this.startTime = Date.now();
				this.startX = e.touches[0].clientX;
				this.startY = e.touches[0].clientY;
			});

			content.addEventListener('touchend', (e) => {
				// Prevent double tap
				const currentTime = Date.now();
				const tapLength = currentTime - this.startTime;

				if (tapLength > 200) return; // too slow

				const deltaX = Math.abs(e.changedTouches[0].clientX - this.startX);
				const deltaY = Math.abs(e.changedTouches[0].clientY - this.startY);

				if (deltaX > 10 || deltaY > 10) return; // moved too much

				if (currentTime - this.lastTap < 300) return; // double tap

				e.preventDefault();
				this.lastTap = currentTime;

				const active = itemDiv.getAttr('active') !== null;
				Array.from(document.getElementsByClassName(this.htmlCls)).forEach((el) => {
					el.toggleAttribute('active', false);
				});
				itemDiv.toggleAttribute('active', !active);
			});

			row.append(this.buildActionsHtml());
		} else {
			content.append(this.buildActionsHtml());
		}

		return itemDiv;
	}

	asInputText(): string {
		if (!this.priority()) {
			return this.getBody();
		}
		return `(${this.priority()}) ${this.getBody()}`;
	}

	get id(): string {
		return this.#id;
	}

	getHtmlCls(): string {
		return TodoItem.HTML_CLS;
	}

	set idx(i: number | undefined) {
		if (i === undefined) {
			return;
		}
		this.#id = 'item-' + randomUUID() + '-' + i;
	}

	get idx(): number | undefined {
		if (this.#id) {
			const idx = this.#id.match(TodoItem.ID_REGEX)?.at(1);
			if (idx) {
				return parseInt(idx);
			}
		}
	}

	setExtension(key: string, value: string): void {
		super.setExtension(key, value);
		processExtensions(this);
	}

	addExtension(key: string, value: string): void {
		if (Object.values(ExtensionType).includes(key as ExtensionType)) {
			if (this.extensions.get(key)) {
				console.warn(`${key} extension already exists! Skipping add: ${value}`);
				return;
			}
		}
		super.addExtension(key, value);
		processExtensions(this);
	}

	getDueInfo(): { htmlCls: string; priority: number } | undefined {
		const val = this.getExtensionValuesAndBodyIndices('due').first()?.value;
		if (!val) {
			return;
		}

		let htmlCls;
		let priority;
		const due = moment(val);
		const now = moment();
		if (due.isSame(now, 'd')) {
			htmlCls = 'todotxt-due-today';
			priority = 3;
		} else if (due.isBefore(now, 'd')) {
			htmlCls = 'todotxt-overdue';
			priority = 4;
		} else if (due.diff(now, 'd') <= 7) {
			htmlCls = 'todotxt-due-week';
			priority = 2;
		} else if (due.diff(now, 'd') <= 30) {
			htmlCls = 'todotxt-due-month';
			priority = 1;
		} else {
			htmlCls = 'todotxt-due-later';
			priority = 0;
		}

		return { htmlCls, priority };
	}

	// Invalidate by postfixing key with '*'
	invalidateExtensions(key: string, value?: string, indices?: number[]): number {
		let count = 0;
		const targetIndices = indices || this.extensions.get(key);
		targetIndices?.forEach((bodyIdx) => {
			const str = this.body.at(bodyIdx);
			if (str !== undefined) {
				const split = str.split(':', 2);
				if (value === undefined || split[1] === value) {
					this.body[bodyIdx] = split[0] + '*:' + split[1];
					count++;
				}
			}
		});

		if (count) {
			const { body, extensions } = this.parseBody(this.getBody());
			this.body = body;
			this.extensions = extensions;
		}

		return count;
	}

	private getPriorityHtmlClasses(): string[] {
		let letterCls;
		switch (this.priority()?.toLowerCase()) {
			case 'a':
				letterCls = 'todotxt-priority-a';
				break;
			case 'b':
				letterCls = 'todotxt-priority-b';
				break;
			case 'c':
				letterCls = 'todotxt-priority-c';
				break;
			default:
				letterCls = 'todotxt-priority-x';
		}

		return [letterCls, 'todotxt-priority'];
	}

	private buildDescriptionHtml(): HTMLElement {
		const description = document.createElement('span');
		description.spellcheck = false;
		description.className = 'todotxt-item-description';

		// Word or Markdown link
		const REGEX = /\[[^[\]()\n]*\]\([^[\]()\n]*\)|\S+/g;
		const bodyItr = this.getBody().matchAll(REGEX);
		let next = bodyItr.next();
		while (!next.done) {
			const val = next.value[0];
			const span = this.buildDueExtensionHtml(val) || this.buildLink(val);
			if (span) {
				description.appendChild(span);
			} else if (val.length > 1 && val.startsWith('@')) {
				description.appendChild(this.buildContextSpan(val));
			} else {
				description.appendText(val);
			}
			description.appendText(' ');
			next = bodyItr.next();
		}

		// @ts-ignore
		if (!app.isMobile) {
			if (!this.complete()) {
				// WYSIWYG editting
				description.setAttr('tabindex', 0);
				description.contentEditable = 'true';

				description.addEventListener('focus', (e) => {
					description.spellcheck = true;
				});

				description.addEventListener('blur', (e) => {
					description.spellcheck = false;
					if (description.textContent) {
						description.textContent = description.textContent.trimEnd();
					}
					if (description.textContent !== this.getBody()) {
						this.setBody(description.textContent ?? '');
						updateTodoItemFromEl(description, this);
					}
				});

				description.addEventListener('keydown', (e) => {
					// console.log(e.key)
					if (e.key === 'Enter') {
						e.preventDefault();
						description.blur();
					} else if (e.key === 'Escape') {
						e.preventDefault();
						description.textContent = this.getBody();
						description.blur();
					} else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
						e.preventDefault();
					}
				});
			}
		}

		return description;
	}

	private buildDueExtensionHtml(str: string): HTMLSpanElement | undefined {
		if (str.startsWith(ExtensionType.DUE + ':')) {
			const split = str.split(':', 2);
			if (!split.at(1)) return;

			const span = document.createElement('span');
			span.setText(str);
			span.addClass('todotxt-due-ext');
			const dueInfo = this.getDueInfo();
			if (dueInfo) {
				span.addClass(dueInfo.htmlCls);
			}

			return span;
		}
	}

	private buildContextSpan(str: string): HTMLSpanElement {
		const span = document.createElement('span');
		span.setText(str);
		span.addClass('todotxt-context');

		return span;
	}

	private buildLink(str: string): HTMLSpanElement | undefined {
		if (/^\w+:\/\//.test(str)) {
			try {
				const span = document.createElement('span');
				span.addClass('cm-url', 'todotxt-link');
				span.setText(str);
				span.setAttr('link', str);

				return span;
			} catch (_) {
				/* empty */
			}
		}

		const REGEX = /\[([^[\]()\n]*)\]\(([^[\]()\n]*)\)/;
		const match = str.match(REGEX);
		if (match) {
			const span = document.createElement('span');
			span.addClass('cm-url', 'todotxt-link');
			span.setText(match.at(1) || '[]');
			const link = match.at(2) || '()';
			span.setAttr('link', link);

			if (!link.startsWith('obsidian://')) {
				try {
					new URL(link);
					span.createSpan({
						cls: 'cm-url external-link todotxt-link',
						attr: { link },
					});
				} catch (_) {
					/* empty */
				}
			}

			return span;
		}
	}

	private buildActionsHtml(): HTMLSpanElement {
		const actions = document.createElement('span');
		actions.className = 'todotxt-item-actions';

		// @ts-ignore
		if (app.isMobile) {
			if (!this.complete()) {
				actions.append(
					new SwipeActionButton(ActionType.EDIT, 'Edit', () =>
						this.openEditModal(actions),
					).render(),
				);

				actions.append(
					new SwipeActionButton(ActionType.STAR, 'Prioritize', (e) => this.prioritize(e)).render(),
				);
			}

			actions.append(
				new SwipeActionButton(ActionType.DEL, 'Delete', () => this.handleDelete(actions)).render(),
			);

			return actions;
		}

		if (this.priority() === null && !this.complete()) {
			actions.append(new ActionButtonV2(ActionType.STAR, (e) => this.prioritize(e)).render());
		}
		actions.append(new ActionButtonV2(ActionType.DEL, () => this.handleDelete(actions)).render());

		return actions;
	}

	private buildPriorityDropDownBadgeHtml(): HTMLSelectElement {
		const select = document.createElement('select');
		select.addClasses(this.getPriorityHtmlClasses());
		const opts = ['none', 'A', 'B', 'C', 'D'];
		const prio = this.priority();
		if (prio !== null && prio > 'D') {
			opts.push(prio);
		}
		opts.forEach((opt) => {
			if (opt === 'none') {
				select.add(new Option('(-)', opt, true, !this.priority()));
			} else {
				select.add(new Option(opt, opt, false, this.priority() === opt));
			}
		});

		select.addEventListener('change', (e) => {
			const t = e.target as HTMLSelectElement;
			if (t.value === 'none') {
				this.clearPriority();
			} else {
				this.setPriority(t.value);
			}
			select.className = '';
			select.addClasses(this.getPriorityHtmlClasses());
			updateTodoItemFromEl(t, this);
		});

		return select;
	}

	private prioritize(e: Event) {
		const t = e.target as SVGElement;
		this.setPriority(
			this.priority()
				? null
				: SETTINGS_READ_ONLY.defaultPriority ?? DEFAULT_SETTINGS.defaultPriority,
		);
		updateTodoItemFromEl(t, this);
	}

	private openEditModal(el: HTMLElement) {
		const editModal = new EditItemModal(this.asInputText(), el, (result) => {
			const { todoList, from, to } = TodoList.from(el);
			if (this.toString() === result.toString()) return;
			todoList.removeItem(this.idx!);
			todoList.add(result);
			update(from, to, todoList);
		});
		editModal.open();
		editModal.textComponent.inputEl.select();
		editModal.textComponent.inputEl.selectionStart = editModal.item.asInputText().length;
	}

	private handleDelete(el: HTMLElement) {
		const { from, to, todoList } = TodoList.from(el);
		todoList.removeItem(this.idx!);
		update(from, to, todoList);
	}

	private buildCheckbox(parentEl: HTMLElement): HTMLInputElement {
		const checkbox = parentEl.createEl('input', {
			type: 'checkbox',
			cls: 'task-list-item-checkbox',
		}) as HTMLInputElement;
		checkbox.setAttr(this.complete() ? 'checked' : 'unchecked', true);
		checkbox.addEventListener('touchend', (e) => {
			const { from, to, todoList } = TodoList.from(checkbox);
			if (this.complete()) {
				this.clearCompleted();
				this.setComplete(false);
			} else {
				this.setCompleted(new Date());
				// if rec extension exists, automatically add new item with due and rec ext
				const recExt = this.getExtensionValuesAndBodyIndices(ExtensionType.RECURRING);
				if (recExt.at(0)) {
					const recurringTask = this.createRecurringTask(recExt[0].value, this);
					if (recurringTask) {
						todoList.add(recurringTask);
					}
				}
			}
			todoList.removeItem(this.idx!);
			todoList.add(this);
			update(from, to, todoList);
			e.preventDefault();
			e.stopPropagation();
		});

		return checkbox;
	}

	private createRecurringTask(rec: string, originalItem: TodoItem): TodoItem | undefined {
		try {
			const hasPlusPrefix = rec.startsWith('+');
			const { date, details } = calculateDate(
				rec,
				hasPlusPrefix
					? moment(originalItem.getExtensionValuesAndBodyIndices(ExtensionType.DUE).first()?.value)
					: null,
			);
			const newItem = new TodoItem('');
			newItem.setPriority(originalItem.priority());
			newItem.setBody(originalItem.getBody());
			newItem.setExtension(ExtensionType.DUE, date);

			let msg = 'Created recurring task due: ' + date;
			if (details) {
				let deets = details;
				if (hasPlusPrefix) {
					deets += ', + option';
				}
				msg += `\n(${deets})`;
			}
			notice(msg, Level.INFO, 10000);

			return newItem;
		} catch (e) {
			console.error(e);
			notice('Failed to create recurring task', Level.ERR);
		}
	}
}
