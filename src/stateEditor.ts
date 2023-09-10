import { EditorView } from '@codemirror/view';
import { Line } from '@codemirror/state';
import { TodoItem, ActionButton } from './model';
import { MarkdownView, Notice } from 'obsidian';
import { UNSAVED_ITEMS } from './todotxtBlockMdProcessor';
import { EditListOptionsModal } from './component';
import TodotxtCodeblocksPlugin from './main';

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
	let noticeMsg = TodotxtCodeblocksPlugin.NAME + ' SAVING\n';
	changes.filter((c) => c.insert).forEach((c) => (noticeMsg += `- ${c.insert}\n`));
	new Notice(noticeMsg, 2500);
}

export function findLine(el: Element, view: EditorView): Line {
	const pos = view.posAtDOM(el);
	const line = view.state.doc.lineAt(pos);
	// console.log("pos", pos, "- line", line);

	if (el.hasClass(TodoItem.HTML_CLS)) {
		/* Workaround since view.posAtDOM(codeBlockLine) returns the position
		 * of the start of the code block.
		 */
		const itemIdx = el.id.match(/\d+$/)?.first();
		if (!itemIdx) {
			throw 'Item element has invalid id: ' + el.id;
		}
		return view.state.doc.line(line.number + 1 + parseInt(itemIdx));
	} else if (el.hasClass(ActionButton.HTML_CLASS) && el.id !== EditListOptionsModal.ID) {
		const itemIdx = el.getAttr('item-id')?.match(/\d+$/)?.first();
		if (!itemIdx) {
			throw 'Item element has invalid id: ' + el.getAttr('item-id');
		}
		return view.state.doc.line(line.number + 1 + parseInt(itemIdx));
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
