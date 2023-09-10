import {
	AbstractTextComponent,
	App,
	ButtonComponent,
	DropdownComponent,
	Setting,
	TextAreaComponent,
} from 'obsidian';
import AutoCompleteableModal from './AutoCompleteableModal';
import { TodoItem, TodoList } from 'src/model';

export default class EditItemModal extends AutoCompleteableModal {
	static ID = 'todotxt-edit-item-modal';

	result: TodoItem;
	onSubmit: (result: TodoItem) => void;
	input: Setting;
	submit: Setting;
	textComponent: AbstractTextComponent<any>;

	constructor(app: App, item: TodoItem, todoList: TodoList, onSubmit: (result: TodoItem) => void) {
		super(
			app,
			new Map([
				['+', todoList.projectGroups.map((group) => group.name)],
				['@', [...todoList.orderedContexts]],
			]),
		);
		this.result = item;
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
				.setDisabled(!this.result.getBody().length)
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}),
		);
		this.submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');

		const handleText = (textComponent: AbstractTextComponent<any>) => {
			this.textComponent = textComponent;
			textComponent.setValue(this.result.getBody());
			textComponent.onChange((text) => {
				this.submit.components
					.find((component) => component instanceof ButtonComponent)
					?.setDisabled(!text);
				this.result.setBody(text);
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
			handlePriorityStyle(this.result.priority(), dropDown);
			dropDown
				.addOptions({
					none: '(-)',
					A: '(A)',
					B: '(B)',
					C: '(C)',
					D: '(D)',
				})
				.onChange((val) => {
					this.result.setPriority(val !== 'none' ? val : null);
					handlePriorityStyle(this.result.priority(), dropDown);
				});
			const prio = this.result.priority();
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
			this.renderForMobile(this.input, addPriorityDropDown);
		} else {
			this.input.addDropdown(addPriorityDropDown);
			this.input.addText(handleText);
		}
	}

	private renderForMobile(
		input: Setting,
		addPriorityDropDown: (dropDown: DropdownComponent) => void,
	) {
		const textComponent = input.components.find(
			(component) => component instanceof TextAreaComponent,
		);
		if (textComponent) {
			const inputEl = (textComponent as TextAreaComponent).inputEl;
			inputEl.select();
			inputEl.selectionStart = this.result.getBody().length;
		}
		input.addDropdown(addPriorityDropDown);
	}

	getSubmitButtonText(): string {
		return 'Edit';
	}
}
