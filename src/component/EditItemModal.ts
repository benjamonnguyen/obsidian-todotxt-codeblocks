import { AbstractTextComponent, App, ButtonComponent, Setting, TextAreaComponent } from 'obsidian';
import AutoCompleteableModal from './AutoCompleteableModal';
import { TodoItem, TodoList } from 'src/model';

export default class EditItemModal extends AutoCompleteableModal {
	static ID = 'edit-item-modal';

	result: TodoItem;
	onSubmit: (result: TodoItem) => void;

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
	}

	onOpen() {
		const { contentEl } = this;

		const input = new Setting(contentEl);
		input.settingEl.addClasses([
			'todotxt-modal-input-begin',
			'todotxt-modal-input',
			'todotxt-modal-input-full',
		]);

		input.addDropdown((dropDown) => {
			dropDown.selectEl.addClasses(['todotxt-modal-dropdown', 'todotxt-modal-dropdown-priority']);
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
				});
			const prio = this.result.priority();
			if (prio) {
				if (prio > 'D') {
					dropDown.addOption(prio, `(${prio})`);
				}
				dropDown.setValue(prio);
			}
		});
		// TODO command to increase/decrease priority

		const submit = new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText('Edit')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}),
		);
		submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');

		const handleText = (textComponent: AbstractTextComponent<any>) => {
			textComponent.setValue(this.result.getBody());
			textComponent.onChange((text) => {
				submit.components
					.find((component) => component instanceof ButtonComponent)
					?.setDisabled(!text);
				this.result.setBody(text);
				this.suggest(text, textComponent);
			});
		};
		// @ts-ignore
		if (this.app.isMobile) {
			input.addTextArea(handleText);
			const textComponent = input.components.find(
				(component) => component instanceof TextAreaComponent,
			);
			if (textComponent) {
				const inputEl = (textComponent as TextAreaComponent).inputEl;
				inputEl.select();
				inputEl.selectionStart = this.result.getBody().length;
			}
		} else {
			input.controlEl.setCssProps({ display: 'contents' });
			input.addText(handleText);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
