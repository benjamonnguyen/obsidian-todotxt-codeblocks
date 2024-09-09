import { App, Setting } from 'obsidian';
import { TodotxtModal } from './TodotxtModal';

export default class ConfirmModal extends TodotxtModal {
	static ID = 'todotxt-confirm-modal';

	text: string;
	subText: string;
	onSubmit: () => Promise<void> | void;

	constructor(text: string, subText: string, onSubmit: () => Promise<void> | void) {
		super();
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
			st.setCssProps({ 'margin-top': '0' });
		}

		const buttons = new Setting(contentEl)
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
		buttons.controlEl.setCssProps({ 'margin-top': '0' });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
