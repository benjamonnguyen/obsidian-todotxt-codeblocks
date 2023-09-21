import { EditorView } from '@codemirror/view';
import { Line } from '@codemirror/state';
import { TodoItem, ActionButton } from './model';
import { Text } from '@codemirror/state';
import { State } from './stateEditor';

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

export function getListStateAtLine(line: number, doc: Text): State | undefined {
	const text: string[] = [];
	const from = doc.line(line).from;
	if (!from) return;
	let to = from;
	for (let i = line; i < doc.lines; i++) {
		const currLine = doc.line(i);
		if (currLine.text.trimEnd() === '```') {
			return {
				from,
				to,
				text: text.join('\n'),
			};
		}
		to = currLine.to;
		text.push(currLine.text);
	}
}
