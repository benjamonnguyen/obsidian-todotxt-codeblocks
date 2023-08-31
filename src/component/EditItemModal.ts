import { AbstractTextComponent, App, ButtonComponent, Setting, TextAreaComponent } from 'obsidian';
import AutoCompleteableModal from './AutoCompleteableModal';
import { TodoList } from 'src/model';

export default class EditItemModal extends AutoCompleteableModal {
	static ID = 'edit-item-modal';

	result: string;
	onSubmit: (result: string) => void;

	constructor(
		app: App,
		originalText: string,
		todoList: TodoList,
		onSubmit: (result: string) => void,
	) {
		super(
			app,
			new Map([
				['+', todoList.projectGroups.map((group) => group.name)],
				['@', [...todoList.orderedContexts]],
			]),
		);
		this.result = originalText;
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
				.setButtonText('Edit')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}),
		);
		submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');

		const handleText = (textComponent: AbstractTextComponent<any>) => {
			textComponent.setValue(this.result);
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
				inputEl.selectionStart = this.result.length;
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
