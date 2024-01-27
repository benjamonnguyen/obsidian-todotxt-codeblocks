import { EditorView } from '@codemirror/view';
import { TodoList } from './model';
import { writeToFile } from './link';

/*
Codeblocks only re-render if there is a change between the fences.
The forceRender flag adds a newline to ChangeSpec.insert which will trigger
todotxtBlockMdProcessor to re-render the codeblock and remove the newline.
*/
export function update(from: number, to: number, list: TodoList, del = false) {
	// @ts-ignore
	const cm = app.workspace.activeEditor.editor.cm as EditorView;

	// update editor
	const insert = del ? undefined : list.toString();
	const transaction = cm.state.update({ changes: { from, to, insert } });
	cm.dispatch(transaction);

	// update linked file
	const langLine = list.languageLine();
	if (langLine.source) {
		const data = del
			? ''
			: list
					.items()
					.map((item) => item.toString())
					.join('\n');
		writeToFile(langLine.source, data);
	}
}
