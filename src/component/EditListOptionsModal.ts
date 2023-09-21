import { App, Modal, Setting } from 'obsidian';
import { LanguageLine } from 'src/model';
import { Level, notice } from 'src/notice';

export class EditListOptionsModal extends Modal {
	static ID = 'todotxt-edit-list-options-modal';

	result: EditListOptionsModalResult;
	onSubmit: (result: EditListOptionsModalResult) => void;

	constructor(
		app: App,
		currentLangLine: LanguageLine,
		onSubmit: (result: EditListOptionsModalResult) => void,
	) {
		super(app);
		this.result = {
			title: currentLangLine.title,
			sortOrders: currentLangLine.sortOrdersToString(),
		};
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		const titleOption = new Setting(contentEl).addText((title) => {
			title.setValue(this.result.title);
			title.onChange((val) => (this.result.title = val));
		});
		titleOption.settingEl.addClasses([
			'todotxt-modal-input',
			'todotxt-modal-input-begin',
			'todotxt-modal-input-3-4',
		]);
		titleOption.setName('Title');

		const sortOrdersOption = new Setting(contentEl);
		sortOrdersOption.settingEl.addClasses(['todotxt-modal-input', 'todotxt-modal-input-3-4']);
		sortOrdersOption.setName('Sort options');
		sortOrdersOption.addText((text) => {
			text.setValue(this.result.sortOrders);
			text.setPlaceholder('sort:default');
			text.onChange((val) => (this.result.sortOrders = val));
		});

		const submit = new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText('Edit')
				.setCta()
				.onClick(() => {
					const errs: Error[] = [];
					for (const sort of this.result.sortOrders.split(' ')) {
						if (sort) {
							const res = LanguageLine.handleSort(sort);
							if (res instanceof Error) {
								errs.push(res);
							}
						}
					}
					if (errs.length) {
						let errMsg = '';
						errs.forEach((e) => (errMsg += `- ${e.message}\n`));
						notice(errMsg, Level.ERR, 15000);
					} else {
						this.close();
						this.onSubmit(this.result);
					}
				}),
		);
		submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export type EditListOptionsModalResult = {
	title: string;
	sortOrders: string;
};
