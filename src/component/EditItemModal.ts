import {
	AbstractTextComponent,
	ButtonComponent,
	DropdownComponent,
	Platform,
	Setting,
} from 'obsidian';
import AutoCompleteableModal from './AutoCompleteableModal';
import { TodoItem, TodoList } from 'src/model';

const rPrio = /^\(([A-Z])\) /;
const prioLength = 4;

export default class EditItemModal extends AutoCompleteableModal {
	static ID = 'todotxt-edit-item-modal';

	item: TodoItem;
	onSubmit: (result: TodoItem) => void;
	input: Setting;
	textComponent: AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>;
	private _priorityDropDown: DropdownComponent;
	submit: Setting;
	protected _cursorPos: number;
	private _hasSuggestion = false;

	constructor(
		itemText: string,
		el: Element,
		onSubmit: (result: TodoItem) => void,
	) {
		const { todoList } = TodoList.from(el);
		super(
			new Map([
				['+', todoList.projectGroups().map((group) => group.name)],
				['@', todoList.orderedContexts()],
			]),
		);
		this.item = new TodoItem(itemText);
		this._cursorPos = itemText.length;
		this.onSubmit = onSubmit;

		const { contentEl } = this;
		this.input = new Setting(contentEl);
		this.submit = new Setting(contentEl);
	}

	onOpen() {
		this.render();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private render() {
		this.input.settingEl.addClasses([
			'todotxt-modal-input-begin',
			'todotxt-modal-input',
			'todotxt-modal-input-full',
		]);

		this.submit.addButton((btn) =>
			btn
				.setButtonText(this.getSubmitButtonText())
				.setDisabled(!(this.textComponent && this.textComponent.getValue().length))
				.setCta()
				.onClick(() => {
					this.close();
					this.item.updateFromInputText(this.textComponent.getValue());
					this.onSubmit(this.item);
				}),
		);
		this.submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');

		const handleText = (
			textComponent: AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>,
		) => {
			this.textComponent = textComponent;
			textComponent.onChange((text) => {
				this.submit.components
					.find((component) => component instanceof ButtonComponent)
					?.setDisabled(!text);
				const matches = rPrio.exec(text);
				this.item.setPriority(matches?.at(1));
				this.updateInputs(text)
			});
			textComponent.setValue(this.item.asInputText());
		};
		const addPriorityDropDown = (dropDown: DropdownComponent) => {
			this._priorityDropDown = dropDown;
			dropDown.selectEl.addClasses(['todotxt-modal-dropdown', 'todotxt-modal-dropdown-priority']);
			const opts = {
				none: '(-)',
				A: '(A)',
				B: '(B)',
				C: '(C)',
				D: '(D)',
			};
			dropDown
				.addOptions(opts)
				.onChange((val) => {
					this.updateInputs('', val);
				});
			this.updatePriorityDropDown();
		};
		// @ts-ignore
		if (this.app.isMobile) {
			this.input.addTextArea(handleText);
		} else {
			this.input.addDropdown(addPriorityDropDown);
			this.input.addText(handleText);
		}
		const updateCursorPos = (e: Event) => {
			e.stopPropagation();
			let x;
			if (x = this.textComponent.inputEl.selectionEnd) {
				this._cursorPos = x;
			}
		};
		this.textComponent.inputEl
			.addEventListener('click', updateCursorPos);
		this.textComponent.inputEl
			.addEventListener('keyup', (e: KeyboardEvent) => {
				if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
					updateCursorPos(e);
					e.stopImmediatePropagation();
				}
			});
		this.textComponent.inputEl
			.addEventListener('keypress', (e: KeyboardEvent) => {
				// accept suggestion on space
				if (this._hasSuggestion && e.key === ' ') {
					this._hasSuggestion = false;
					this.textComponent.inputEl.selectionStart = this._cursorPos;
					e.stopImmediatePropagation();
				}
			});
	}

	set cursorPos(pos: number) {
		this._cursorPos = pos;
		this.textComponent.inputEl.focus();
		this.textComponent.inputEl.setSelectionRange(this.cursorPos, this.cursorPos);
	}

	getSubmitButtonText(): string {
		return 'Edit';
	}

	updateInputs(text: string, prio: string | null = null) {
		if (prio !== null) {
			const replace = prio === 'none' ? '' : `(${prio}) `;
			if (replace && !this.item.priority()) {
				this.textComponent.setValue(replace + this.textComponent.getValue());
				this._cursorPos += prioLength;
			} else {
				this.textComponent.setValue(this.textComponent.getValue().replace(/^\([A-Z]\) /, replace));
				if (!replace) {
					this._cursorPos -= prioLength;
				}
			}
			this.item.setPriority(prio === 'none' ? null : prio);

			this.textComponent.inputEl.focus();
			this.textComponent.inputEl.setSelectionRange(this._cursorPos, this._cursorPos);
			this.updatePriorityDropDown();
			return;
		}

		// set dropdown from text input
		const matches = rPrio.exec(text);
		this.item.setPriority(matches?.at(1));
		this.updatePriorityDropDown();

		//
		if (!(this._hasSuggestion = this.suggest(text, this.textComponent))) {
			this.textComponent.setValue(text);
		};
		this._cursorPos = this.textComponent.inputEl.selectionEnd!;
	}

	protected handlePriorityStyle(priority: string | null, dropDown: DropdownComponent) {
		if (Platform.isWin) {
			dropDown.selectEl.addClass('is-windows');
		}
		dropDown.selectEl.removeClasses([
			'todotxt-priority-a',
			'todotxt-priority-b',
			'todotxt-priority-c',
			'todotxt-priority-x',
		]);
		if (!priority) {
			/* empty */
		} else if (priority === 'A') {
			dropDown.selectEl.addClass('todotxt-priority-a');
		} else if (priority === 'B') {
			dropDown.selectEl.addClass('todotxt-priority-b');
		} else if (priority === 'C') {
			dropDown.selectEl.addClass('todotxt-priority-c');
		} else {
			dropDown.selectEl.addClass('todotxt-priority-x');
		}
	}

	protected updatePriorityDropDown() {
		// @ts-ignore
		if (this.app.isMobile) {
			return;
		}
		const prio = this.item.priority();
		if (prio === null) {
			this.item.clearPriority();
		} else {
			this.item.setPriority(prio);
			if (this.item.priority()! > 'D') {
				const arr = Array.from(this._priorityDropDown.selectEl.options).map(e => e.value);
				if (!arr.contains(prio)) {
					this._priorityDropDown.addOption(prio, `(${prio})`);
				}
			}
		}
		this.handlePriorityStyle(this.item.priority(), this._priorityDropDown);
		this._priorityDropDown.setValue(prio ?? 'none');
	}
}
