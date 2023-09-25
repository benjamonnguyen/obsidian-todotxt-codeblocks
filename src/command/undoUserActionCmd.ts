import { Editor, MarkdownView } from 'obsidian';
import { undo } from 'src/stateEditor';

export default {
	id: 'undo-user-action',
	name: 'Undo user action',
	editorCallback: (_: Editor, mdView: MarkdownView) => {
		undo(mdView);
	},
};
