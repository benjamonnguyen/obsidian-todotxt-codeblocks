import { ButtonComponent, MarkdownView, Plugin } from 'obsidian';
import { todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import { toggleCheckbox, toggleProjectGroup, save, clickEdit, clickDelete, clickAdd } from './stateEditor';


export default class TodotxtCodeblocksPlugin extends Plugin {

	static NAME = "obsidian-todotxt-codeblocks";

	async onload() {
		this.registerMarkdownCodeBlockProcessor("todotxt", todotxtBlockProcessor);
		this.registerDomEvent(document, "click", (event: MouseEvent) => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (mdView) {
				toggleCheckbox(event, mdView)
					|| toggleProjectGroup(event, mdView)
					|| clickEdit(event, mdView, this.app)
					|| clickDelete(event, mdView)
					|| clickAdd(event, mdView, this.app)
					;
			}
		});
		this.registerDomEvent(document, "keypress", (event: KeyboardEvent) => {
			if (event.key === "Enter") {
				const actionBtn = document.getElementsByClassName("mod-cta").item(0) as HTMLButtonElement | null;
				actionBtn?.click();
			}
		});
		this.registerInterval(window.setInterval(() => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			save(mdView!);
		}, 2000));
	}

	onunload() {
	}
}
