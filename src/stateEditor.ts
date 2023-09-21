import { MarkdownView } from 'obsidian';
import { saveChanges } from './todotxtBlockMdProcessor';
import { EditorView } from '@codemirror/view';
import { getListStateAtLine } from './documentUtil';
import { Level, notice } from './notice';

type StateHistory = {
	listLine: number;
	startState: string;
	newState: string;
	forceRender: boolean;
};

let UNDO_HISTORY: StateHistory | null = null;

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
export function update(
	mdView: MarkdownView,
	changes: State[],
	listLineToPreserveState = 0,
	forceRender = false,
) {
	if (!changes.length) return;
	// console.info('todotxt-codeblocks changes:', changes);
	saveChanges(mdView); // Prevent race condition by checking if there are UNSAVED_ITEMS pending

	// @ts-ignore
	const view = mdView.editor.cm as EditorView;

	const transaction = view.state.update({
		changes: changes.map(({ from, to, text }) => {
			if (forceRender) text += '\n';
			return { from, to, insert: text };
		}),
	});
	if (listLineToPreserveState) {
		const startState = getListStateAtLine(listLineToPreserveState, transaction.startState.doc)
			?.text;
		const newState = getListStateAtLine(listLineToPreserveState, transaction.newDoc)?.text;
		if (startState && newState) {
			UNDO_HISTORY = {
				listLine: listLineToPreserveState,
				startState,
				newState,
				forceRender,
			};
		}
	}
	view.dispatch(transaction);
}

export function undo(mdView: MarkdownView) {
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;

	if (UNDO_HISTORY) {
		const currState = getListStateAtLine(UNDO_HISTORY.listLine, view.state.doc);
		if (!currState) return;
		if (currState.text === UNDO_HISTORY.newState) {
			update(mdView, [{ from: currState.from, to: currState.to, text: UNDO_HISTORY.startState }]);
		} else if (
			UNDO_HISTORY.forceRender &&
			currState.text &&
			currState.text.length === UNDO_HISTORY.newState.length - 1 &&
			UNDO_HISTORY.newState.startsWith(currState.text)
		) {
			update(mdView, [
				{ from: currState.from, to: currState.to, text: UNDO_HISTORY.startState + '\n' },
			]);
		} else {
			notice('Cannot undo - Codeblock may have moved', Level.WARN);
		}
		UNDO_HISTORY = null;
	} else {
		notice('No undo history available', Level.WARN, 2500);
	}
}
