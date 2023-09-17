import { MarkdownView } from 'obsidian';
import { AddItemModal } from 'src/component';
import { TodoList } from 'src/model';
import { findLine, updateDocument } from 'src/documentUtil';

export default function clickAdd(target: EventTarget, mdView: MarkdownView): boolean {
	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const newTarget = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	const listId = newTarget?.getAttr('target-id');
	if (!newTarget || newTarget.getAttr('action') !== AddItemModal.ID || !listId) {
		return false;
	}
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const listEl = document.getElementById(listId);
	if (!listEl) return false;
	const listLine = findLine(listEl, view);

	const { todoList, from, to } = TodoList.from(listLine.number, view);
	const addModal = new AddItemModal(mdView.app, todoList, (result) => {
		todoList.add(result);
		updateDocument(mdView, [{ from, to, insert: todoList.toString() }]);
	});
	addModal.open();
	addModal.textComponent.inputEl.select();

	return true;
}
