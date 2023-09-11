import { MarkdownView, Plugin } from 'obsidian';
import { todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import { save } from './stateEditor';
import {
	toggleCheckbox,
	toggleProjectGroup,
	clickEdit,
	clickAdd,
	clickDelete,
} from './event-handler';
import { createNewTaskCmd } from './command';

export default class TodotxtCodeblocksPlugin extends Plugin {
	static NAME = 'obsidian-todotxt-codeblocks';

	async onload() {
		this.registerExtensions(['todotxt'], 'markdown');
		this.registerMarkdownCodeBlockProcessor('todotxt', todotxtBlockProcessor);
		this.registerDomEvent(document, 'click', (event: MouseEvent) => {
			const { target } = event;
			if (!target) return;

			if (this.clickLink(event)) return;
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (mdView) {
				toggleCheckbox(event, mdView) ||
					toggleProjectGroup(event, mdView) ||
					clickEdit(event, mdView) ||
					clickAdd(target, mdView) ||
					clickDelete(event, mdView);
			}
		});
		this.registerDomEvent(document, 'keypress', (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				const actionBtn = document
					.getElementsByClassName('mod-cta')
					.item(0) as HTMLButtonElement | null;
				actionBtn?.click();
			}
		});
		this.registerInterval(
			window.setInterval(() => {
				const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
				save(mdView!);
			}, 2000),
		);
		this.addCommand(createNewTaskCmd);
	}

	onunload() {}

	private clickLink(event: MouseEvent): boolean {
		const { target } = event;
		if (!target || !(target instanceof HTMLSpanElement)) {
			return false;
		}
		const link = target.getAttr('link');
		if (target.hasClass('todotxt-link') && link) {
			try {
				window.open(new URL(link));
				return true;
			} catch (_) {
				/* empty */
			}
			this.app.workspace.openLinkText(link, link);
			return true;
		}
		return false;
	}
}
