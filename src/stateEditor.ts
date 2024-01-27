import { MarkdownView } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { TodoList } from './model';
import { writeToFile } from './link';

// type StateHistory = {
// 	listLine: number;
// 	startState: string;
// 	newState: string;
// 	forceRender: boolean;
// };

// let UNDO_HISTORY: StateHistory | null = null;

export type State = {
	from: number;
	to?: number;
	text?: string;
};

/*
Codeblocks only re-render if there is a change between the fences.
The forceRender flag adds a newline to ChangeSpec.insert which will trigger
todotxtBlockMdProcessor to re-render the codeblock and remove the newline.
*/
export function update(from: number, to: number, list: TodoList, del = false) {
	// @ts-ignore
	const cm = app.workspace.activeEditor.editor.cm as EditorView;

	//
	const insert = del ? undefined : list.toString();
	const transaction = cm.state.update({ changes: { from, to, insert } });
	cm.dispatch(transaction);

	//
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

export function undo(mdView: MarkdownView) {
	// // @ts-ignore
	// const view = mdView.editor.cm as EditorView;
	// if (UNDO_HISTORY) {
	// 	const currState = getListStateAtLine(UNDO_HISTORY.listLine, view.state.doc);
	// 	if (!currState) return;
	// 	if (currState.text === UNDO_HISTORY.newState) {
	// 		update(mdView, [{ from: currState.from, to: currState.to, text: UNDO_HISTORY.startState }]);
	// 	} else if (
	// 		UNDO_HISTORY.forceRender &&
	// 		currState.text &&
	// 		currState.text.length === UNDO_HISTORY.newState.length - 1 &&
	// 		UNDO_HISTORY.newState.startsWith(currState.text)
	// 	) {
	// 		update(mdView, [
	// 			{ from: currState.from, to: currState.to, text: UNDO_HISTORY.startState + '\n' },
	// 		]);
	// 	} else {
	// 		notice('Cannot undo - Codeblock may have moved', Level.WARN);
	// 	}
	// 	UNDO_HISTORY = null;
	// } else {
	// 	notice('No undo history available', Level.WARN, 2500);
	// }
}
