import { MarkdownView } from 'obsidian';
import { AddItemModal } from 'src/component';
import { ActionType, TodoList, TodoItem } from 'src/model';
import { findLine, updateView } from 'src/stateEditor';

export default function clickAdd(target: EventTarget, mdView: MarkdownView): boolean {
	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const newTarget = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	const listId = newTarget?.getAttr('item-id');
	if (!newTarget || newTarget.getAttr('action') !== ActionType.ADD.name || !listId) {
		return false;
	}
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const listEl = document.getElementById(listId);
	if (!listEl) return false;
	const listLine = findLine(listEl, view);

	const { todoList, from, to } = TodoList.from(listLine.number, view);
	new AddItemModal(mdView.app, new TodoItem(''), todoList, (result) => {
		todoList.items.push(result);
		todoList.sort();
		updateView(mdView, [{ from, to, insert: todoList.toString() }]);
	}).open();

	return true;
}