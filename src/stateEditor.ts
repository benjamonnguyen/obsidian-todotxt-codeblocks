import { EditorView } from '@codemirror/view';
import { Line } from '@codemirror/state';
import { TodoItem, ActionButton } from './model';
import { MarkdownView } from 'obsidian';
import { UNSAVED_ITEMS } from './todotxtBlockMdProcessor';
import { notice, Level } from './notice';

export function save(mdView: MarkdownView) {
	if (!UNSAVED_ITEMS || !UNSAVED_ITEMS.length) return;
	// State changes do not persist to EditorView in Reading mode.
	if (mdView.getMode() === 'preview') return;
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;

	const items = [...UNSAVED_ITEMS];
	UNSAVED_ITEMS.length = 0;
	const changes: { from: number; to: number; insert?: string }[] = [];

	items.forEach(({ listId, line, newText }) => {
		const list = document.getElementById(listId);
		if (!list) return;
		const listLine = findLine(list, view);

		const itemLine = view.state.doc.line(listLine.number + line);
		if (newText) {
			changes.push({ from: itemLine.from, to: itemLine.to, insert: newText });
		} else {
			changes.push({ from: itemLine.from, to: itemLine.to + 1 });
		}
	});

	updateView(mdView, changes);
	let noticeMsg = 'Saving changes...\n';
	changes.filter((c) => c.insert).forEach((c) => (noticeMsg += `- ${c.insert}\n`));
	notice(noticeMsg, Level.INFO, 2500);
}

export function findLine(el: Element, view: EditorView): Line {
	const pos = view.posAtDOM(el);
	const line = view.state.doc.lineAt(pos);
	// console.log("pos", pos, "- line", line);

	if (el.hasClass(TodoItem.HTML_CLS)) {
		/* Workaround since view.posAtDOM(codeBlockLine) returns the position
		 * of the start of the code block.
		 */
		const itemIdx = el.id.match(TodoItem.ID_REGEX)?.at(1);
		if (!itemIdx) {
			throw 'Item element has invalid id: ' + el.id;
		}
		return view.state.doc.line(line.number + 1 + parseInt(itemIdx));
	} else if (el.hasClass(ActionButton.HTML_CLASS)) {
		const targetId = el.getAttr('target-id');
		if (!targetId) {
			/* empty */
		} else if (targetId.startsWith('list-')) {
			return view.state.doc.lineAt(pos);
		} else {
			const itemIdx = targetId.match(TodoItem.ID_REGEX)?.at(1);
			if (itemIdx) {
				return view.state.doc.line(line.number + 1 + parseInt(itemIdx));
			}
		}
		throw 'ActionButton element has invalid id: ' + el.id;
	}

	return view.state.doc.lineAt(pos);
}

export function updateView(
	mdView: MarkdownView,
	changes: { from: number; to?: number; insert?: string }[],
) {
	console.log('changes:', changes);
	save(mdView); // Prevent race condition by checking if there are UNSAVED_ITEMS pending
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const transaction = view.state.update({ changes: changes });
	view.dispatch(transaction);
}
