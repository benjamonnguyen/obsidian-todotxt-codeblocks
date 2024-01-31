import { MarkdownView } from 'obsidian';
import { AddItemModal } from 'src/component';
import { TodoList } from 'src/model';
import { update } from 'src/stateEditor';

export default function clickAdd(target: EventTarget, mdView: MarkdownView): boolean {
	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const newTarget = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	const listId = newTarget?.getAttr('target-id');
	if (!newTarget || newTarget.getAttr('action') !== AddItemModal.ID || !listId) {
		return false;
	}
	const listEl = document.getElementById(listId);
	if (!listEl) return false;

	const { todoList, from, to } = TodoList.from(listEl);
	const addModal = new AddItemModal(mdView.app, todoList, (result) => {
		todoList.add(result);
		update(from, to, todoList);
	});
	addModal.open();
	addModal.textComponent.inputEl.select();

	return true;
}
