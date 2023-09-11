import { AbstractTextComponent, App, ButtonComponent, DropdownComponent, Setting } from 'obsidian';
import AutoCompleteableModal from './AutoCompleteableModal';
import { TodoItem, TodoList } from 'src/model';

export default class EditItemModal extends AutoCompleteableModal {
	static ID = 'todotxt-edit-item-modal';

	item: TodoItem;
	body: string;
	onSubmit: (result: TodoItem) => void;
	input: Setting;
	submit: Setting;
	textComponent: AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>;

	constructor(app: App, item: TodoItem, todoList: TodoList, onSubmit: (result: TodoItem) => void) {
		super(
			app,
			new Map([
				['+', todoList.projectGroups.map((group) => group.name)],
				['@', [...todoList.orderedContexts]],
			]),
		);
		this.body = item.getBody();
		this.item = item;
		this.onSubmit = onSubmit;

		const { contentEl } = this;
		this.input = new Setting(contentEl);
		this.submit = new Setting(contentEl);
	}

	onOpen() {
		this.render();
		this.textComponent.inputEl.focus();
		this.textComponent.inputEl.select();
		this.textComponent.inputEl.selectionStart = this.body.length;
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
				.setDisabled(!this.body.length)
				.setCta()
				.onClick(() => {
					this.close();
					this.item.setBody(this.body);
					this.onSubmit(this.item);
				}),
		);
		this.submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');

		const handleText = (
			textComponent: AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>,
		) => {
			this.textComponent = textComponent;
			textComponent.setValue(this.body);
			textComponent.onChange((text) => {
				this.submit.components
					.find((component) => component instanceof ButtonComponent)
					?.setDisabled(!text);
				this.body = text;
				this.suggest(text, textComponent);
			});
		};
		const addPriorityDropDown = (dropDown: DropdownComponent) => {
			const handlePriorityStyle = (priority: string | null, dropDown: DropdownComponent) => {
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
			};
			dropDown.selectEl.addClasses(['todotxt-modal-dropdown', 'todotxt-modal-dropdown-priority']);
			handlePriorityStyle(this.item.priority(), dropDown);
			dropDown
				.addOptions({
					none: '(-)',
					A: '(A)',
					B: '(B)',
					C: '(C)',
					D: '(D)',
				})
				.onChange((val) => {
					this.item.setPriority(val !== 'none' ? val : null);
					handlePriorityStyle(this.item.priority(), dropDown);
				});
			const prio = this.item.priority();
			if (prio) {
				if (prio > 'D') {
					dropDown.addOption(prio, `(${prio})`);
				}
				dropDown.setValue(prio);
			}
		};
		// @ts-ignore
		if (this.app.isMobile) {
			this.input.addTextArea(handleText);
			this.input.addDropdown(addPriorityDropDown);
		} else {
			this.input.addDropdown(addPriorityDropDown);
			this.input.addText(handleText);
		}
	}

	getSubmitButtonText(): string {
		return 'Edit';
	}
}
