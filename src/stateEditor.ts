import { EditorView } from '@codemirror/view';
import { TodoList } from './model';
import { writeToFile } from './link';

export enum UpdateOption {
	DELETE,
	/*
	Codeblocks only re-render if there is a change between the fences.
	The FORCE_RENDER option adds an extra newline to ChangeSpec.insert which will trigger
	todotxtBlockMdProcessor to re-render the codeblock.
	*/
	FORCE_RENDER,
	NO_WRITE,
}
export function update(from: number, to: number, list: TodoList, ...options: UpdateOption[]) {
	// @ts-ignore
	const cm = app.workspace.activeEditor.editor.cm as EditorView;

	// update editor
	const insert = options.contains(UpdateOption.DELETE) ? undefined : list.toString();
	if (options.contains(UpdateOption.FORCE_RENDER)) {
		cm.dispatch({ changes: { from, to } });
		cm.dispatch({ changes: { from, insert } });
	} else {
		cm.dispatch({ changes: { from, to, insert } });
	}

	// update linked file
	if (options.contains(UpdateOption.NO_WRITE)) return;
	const langLine = list.languageLine();
	if (langLine.source) {
		const data = options.contains(UpdateOption.DELETE)
			? ''
			: list
					.items()
					.map((item) => item.toString())
					.join('\n');
		writeToFile(langLine.source, data);
	}
}
