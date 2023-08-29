import { AbstractTextComponent, App, ButtonComponent, Setting, TextAreaComponent } from 'obsidian';
import { TodoList } from 'src/model';
import AutoCompleteableModal from './AutoCompleteableModal';

export default class AddModal extends AutoCompleteableModal {
	static ID = 'todotxt-add-modal';
	static placeholders = [
		'(B) Call Mom @Phone +Family rec:1m',
		'(C) Schedule annual checkup +Health due:1yM',
		'Pick up milk +Groceries due:Sa',
		'Tend to herb @garden +Home rec:1w2d',
		'(A) Fix parsing @bug +obsidian-todotxt-codeblocks due:0',
		'Ship new @feature +obsidian-todotxt-codeblocks due:2040-08-06',
	];

	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, todoList: TodoList, onSubmit: (result: string) => void) {
		super(
			app,
			new Map([
				['+', todoList.projectGroups.map((group) => group.name)],
				['@', [...todoList.orderedContexts]],
			]),
		);
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

		const submit = new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText('Add')
				.setDisabled(true)
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}),
		);
		submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');

		const handleText = (
			textComponent: AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>,
		) => {
			textComponent.setPlaceholder(
				AddModal.placeholders[Math.floor(Math.random() * AddModal.placeholders.length)],
			);
			textComponent.onChange((text) => {
				submit.components
					.find((component) => component instanceof ButtonComponent)
					?.setDisabled(!text);
				this.result = text;
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
			}
		} else {
			input.addText(handleText);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
