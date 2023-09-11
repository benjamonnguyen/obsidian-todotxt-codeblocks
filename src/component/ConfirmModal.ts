import { App, Modal, Setting } from 'obsidian';

export default class ConfirmModal extends Modal {
	static ID = 'todotxt-confirm-modal';

	text: string;
	subText: string;
	onSubmit: () => Promise<void>;

	constructor(app: App, text: string, subText: string, onSubmit: () => Promise<void>) {
		super(app);
		this.text = text;
		this.subText = subText;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', {
			text: this.text,
		});
		if (this.subText) {
			const st = contentEl.createEl('p');
			st.setText(this.subText);
		}

		new Setting(contentEl)
			.addButton((confirmBtn) => {
				confirmBtn.setClass('todotxt-modal-submit');
				confirmBtn
					.setButtonText('Confirm')
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit();
					});
			})
			.addButton((cancelBtn) => {
				cancelBtn.setClass('todotxt-modal-cancel');
				cancelBtn
					.setButtonText('Cancel')
					.setCta()
					.onClick(() => this.close());
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
