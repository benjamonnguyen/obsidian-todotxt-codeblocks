import { EditorView } from '@codemirror/view';
import { Line } from '@codemirror/state';
import { TodoItem, ActionButton } from './model';
import { MarkdownView } from 'obsidian';
import { saveChanges } from './todotxtBlockMdProcessor';

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
	if (!changes.length) return;
	console.info('todotxt-codeblocks changes:', changes);
	saveChanges(mdView); // Prevent race condition by checking if there are UNSAVED_ITEMS pending
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const transaction = view.state.update({ changes: changes });
	view.dispatch(transaction);
}
