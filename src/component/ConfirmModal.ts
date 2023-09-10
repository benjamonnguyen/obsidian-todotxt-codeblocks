import { App, Modal, Setting } from 'obsidian';

export default class ConfirmModal extends Modal {
	static ID = 'todotxt-confirm-modal';

	text: string;
	onSubmit: () => void;

	constructor(app: App, text: string, onSubmit: () => void) {
		super(app);
		this.text = text;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', {
			text: this.text,
		});

		const submit = new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText('Confirm')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit();
				}),
		);
		submit.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-submit');

		const cancel = new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => this.close()),
		);
		cancel.settingEl.addClass('todotxt-modal-btn', 'todotxt-modal-cancel');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
