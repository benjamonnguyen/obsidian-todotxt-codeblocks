import { Editor, MarkdownView, Notice } from 'obsidian';
import { AddItemModal } from 'src/component';
import TodotxtCodeblocksPlugin from 'src/main';
import { clickAdd } from 'src/event-handler';

export default {
	id: 'create-new-todotxt-task-cmd',
	name: 'Create new task in focused list',
	editorCallback: (editor: Editor, view: MarkdownView) => {
		const addBtn = Array.from(view.contentEl.getElementsByClassName('todotxt-action-btn'))
			.filter((a) => a.id === AddItemModal.ID)
			.filter((a) => a.getCssPropertyValue('color') !== 'rgba(0, 0, 0, 0)')
			.first();
		if (addBtn) {
			clickAdd(addBtn as EventTarget, view);
		} else {
			new Notice(
				TodotxtCodeblocksPlugin.NAME + ' WARNING\nNo focused Todo.txt codeblock available',
			);
		}
	},
};
