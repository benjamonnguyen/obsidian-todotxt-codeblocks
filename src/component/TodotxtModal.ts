import { App, Modal } from 'obsidian';

export abstract class TodotxtModal extends Modal {
	constructor(app: App) {
		super(app);
		// this.modalEl.addClass('todotxt-modal');
		this.scope.register([], 'Enter', (evt: KeyboardEvent) => {
			if (evt.isComposing) {
				return;
			}
			(document.getElementsByClassName('mod-cta').item(0) as HTMLButtonElement | null)?.click();
		});
	}
}
