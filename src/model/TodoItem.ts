import { v4 as randomUUID } from 'uuid';
import { ActionButton, ActionType, type ViewModel } from '.';
import { Item } from './Item';
import { EditItemModal } from 'src/component';
import { moment } from 'obsidian';
import { processExtensions, ExtensionType } from 'src/extension';
import { updateTodoItemFromEl } from 'src/stateEditor';
import { ActionButtonV2 } from './ActionButtonV2';
import { DEFAULT_SETTINGS } from 'src/settings';

export default class TodoItem extends Item implements ViewModel {
	static HTML_CLS = 'todotxt-item';
	static ID_REGEX = /^item-\S+-(\d+)$/;

	#id: string;

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

		const checkbox = itemDiv.createEl('input', {
			type: 'checkbox',
			cls: 'task-list-item-checkbox',
		});
		checkbox.setAttr(this.complete() ? 'checked' : 'unchecked', true);

		this.buildDescriptionHtml(itemDiv);

		const actions = itemDiv.createSpan({
			cls: 'todotxt-item-actions',
		});
		if (this.priority() === null && !this.complete()) {
			const prioritizeBtn = new ActionButtonV2(
				ActionType.ADD,
				e => this.prioritize(e),
			).render();
			actions.append(prioritizeBtn);
		}
		actions.append(
			new ActionButton(ActionType.EDIT, EditItemModal.ID, itemDiv.id).render(),
			new ActionButton(ActionType.DEL, 'todotxt-delete-item', itemDiv.id).render(),
		);

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

	private buildDescriptionHtml(itemEl: HTMLElement): HTMLElement {
		const description = itemEl.createSpan({
			cls: 'todotxt-item-description',
		});

		const prio = this.priority();
		if (prio && !this.complete()) {
			this.buildPriorityDropDownBadgeHtml(description);
		}

		// Word or Markdown link
		const REGEX = /\[[^[\]()\n]*\]\([^[\]()\n]*\)|\S+/g;
		const bodyItr = this.getBody().matchAll(REGEX);
		let next = bodyItr.next();
		while (!next.done) {
			const span = this.buildDueExtensionHtml(next.value[0]) || this.buildLink(next.value[0]);
			if (span) {
				description.appendChild(span);
			} else {
				description.appendText(next.value[0]);
			}
			description.appendText(' ');
			next = bodyItr.next();
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
			const due = moment(split.at(1));
			const now = moment();
			if (due.isSame(now, 'd')) {
				span.addClass('todotxt-due-today');
			} else if (due.isBefore(now, 'd')) {
				span.addClass('todotxt-overdue');
			} else if (due.diff(now, 'd') <= 7) {
				span.addClass('todotxt-due-week');
			} else if (due.diff(now, 'd') <= 30) {
				span.addClass('todotxt-due-month');
			} else {
				span.addClass('todotxt-due-later');
			}

			return span;
		}
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

	private buildPriorityDropDownBadgeHtml(div: Element) {
		const select = div.createEl('select', {
			cls: this.getPriorityHtmlClasses(),
		});

		const opts = [['none', '(-)'], ['A'], ['B'], ['C'], ['D']];
		opts.forEach(opt => {
			if (opt.length == 2) {
				select.add(new Option(opt[1], opt[0], true, !this.priority()));
			} else {
				const p = opt[0];
				select.add(new Option(p, p, false, this.priority() === p));
			}
		})

		select.addEventListener('change', e => {
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
	}

	private prioritize(e: MouseEvent) {
		const t = e.target as SVGElement;
		this.setPriority(DEFAULT_SETTINGS.defaultPriority ?? 'A');
		updateTodoItemFromEl(t, this);
	}
}
