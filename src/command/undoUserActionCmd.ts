import { Editor, MarkdownView } from 'obsidian';
import { undo } from 'src/stateEditor';

export default {
	id: 'undo-todotxt-user-action-cmd',
	name: 'Undo user action',
	editorCallback: (_: Editor, mdView: MarkdownView) => {
		undo(mdView);
	},
};
