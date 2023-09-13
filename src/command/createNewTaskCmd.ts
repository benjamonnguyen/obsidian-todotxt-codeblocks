import { Editor, MarkdownView } from 'obsidian';
import { AddItemModal } from 'src/component';
import { clickAdd } from 'src/event-handler';
import { Level, notice } from 'src/notice';

export default {
	id: 'create-new-todotxt-task-cmd',
	name: 'Create new task in focused list',
	editorCallback: (_: Editor, view: MarkdownView) => {
		const addBtn = Array.from(view.contentEl.getElementsByClassName('todotxt-action-btn'))
			.filter((a) => a.getAttr('action') === AddItemModal.ID)
			.filter((a) => a.getCssPropertyValue('color') !== 'rgba(0, 0, 0, 0)')
			.first();
		if (addBtn) {
			clickAdd(addBtn as EventTarget, view);
		} else {
			notice('No focused Todo.txt codeblock available', Level.WARN);
		}
	},
};
