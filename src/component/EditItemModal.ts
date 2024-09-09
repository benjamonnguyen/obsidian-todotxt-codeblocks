import {
	AbstractTextComponent,
	ButtonComponent,
	DropdownComponent,
	Platform,
	Setting,
} from 'obsidian';
import AutoCompleteableModal from './AutoCompleteableModal';
import { TodoItem, TodoList } from 'src/model';

export default class EditItemModal extends AutoCompleteableModal {
	static ID = 'todotxt-edit-item-modal';

	item: TodoItem;
	onSubmit: (result: TodoItem) => void;
	input: Setting;
	textComponent: AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>;
	private _priorityDropDown: DropdownComponent;
	submit: Setting;
	protected cursorPos: number;

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
		this.cursorPos = itemText.length;
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
				.setDisabled(!this.item.asInputText().length)
				.setCta()
				.onClick(() => {
					this.close();
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
				this.suggest(text, textComponent);
				this.persistInput(text)
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
					if (this.item.priority() === null && val !== 'none') {
						this.cursorPos += 4;
					} else if (this.item.priority() !== null && val === 'none') {
						this.cursorPos = Math.max(this.cursorPos - 4, 0);
					}
					this.updatePriorityDropDown(val);
					this.textComponent.setValue(this.item.asInputText());
					this.persistInput(this.item.asInputText(), this.cursorPos);
				});
			this.updatePriorityDropDown(this.item.priority());
		};
		// @ts-ignore
		if (this.app.isMobile) {
			this.input.addTextArea(handleText);
		} else {
			this.input.addDropdown(addPriorityDropDown);
			this.input.addText(handleText);
		}
	}

	getSubmitButtonText(): string {
		return 'Edit';
	}

	persistInput(text: string, cursorPos: number | null = null) {
		this.textComponent.setValue(text);
		this.item.updateFromInputText(text);
		this.updatePriorityDropDown(this.item.priority());
		if (cursorPos !== null) {
			this.textComponent.inputEl.focus();
			this.textComponent.inputEl.setSelectionRange(cursorPos, cursorPos);
		}

		this.cursorPos = cursorPos ?? this.textComponent.inputEl.selectionStart ?? 0;
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

	protected updatePriorityDropDown(val: string | null) {
		// @ts-ignore
		if (this.app.isMobile) {
			return;
		}
		val = val ?? 'none';
		if (val === 'none') {
			this.item.clearPriority();
		} else {
			this.item.setPriority(val);
			if (this.item.priority()! > 'D') {
				const arr = Array.from(this._priorityDropDown.selectEl.options).map(e => e.value);
				if (!arr.contains(val)) {
					this._priorityDropDown.addOption(val, `(${val})`);
				}
			}
		}
		this.handlePriorityStyle(this.item.priority(), this._priorityDropDown);
		this._priorityDropDown.setValue(val);
	}
}
