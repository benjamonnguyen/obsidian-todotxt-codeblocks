import { MarkdownView } from 'obsidian';
import { EditItemModal, EditListOptionsModal } from 'src/component';
import { TodoList, TodoItem, LanguageLine } from 'src/model';
import { ActionType } from 'src/model';
import { update } from 'src/stateEditor';

export default function clickEdit(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;

	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const editBtnEl = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	if (!editBtnEl || editBtnEl.getAttr('action-type') !== ActionType.EDIT.name) {
		return false;
	}
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const pos = view.posAtDOM(editBtnEl);
	const listLine = view.state.doc.lineAt(pos);
	const { todoList, from, to } = TodoList.from(listLine.number, view);

	const action = editBtnEl.getAttr('action');
	if (action === EditItemModal.ID) {
		const itemId = editBtnEl.getAttr('target-id')?.match(TodoItem.ID_REGEX)?.at(1);
		if (!itemId) {
			console.error('EditBtn element has invalid target-id:', editBtnEl.id);
			return true;
		}
		const itemIdx = parseInt(itemId);
		const itemText = view.state.doc.line(listLine.number + 1 + itemIdx).text;

		const editModal = new EditItemModal(mdView.app, itemText, todoList, (result) => {
			if (itemText.toString() === result.toString()) return;
			todoList.edit(itemIdx, result);
			update(mdView, [{ from, to, text: todoList.toString() }], listLine.number);
		});
		editModal.open();
		editModal.textComponent.inputEl.select();
		editModal.textComponent.inputEl.selectionStart = editModal.item.getBody().length;
	} else if (action === EditListOptionsModal.ID) {
		const currLangLine = todoList.languageLine();
		new EditListOptionsModal(this.app, currLangLine, (result) => {
			const newLangLine = LanguageLine.from(currLangLine.toString()).langLine;
			newLangLine.title = result.title;
			newLangLine.source = result.source;
			newLangLine.sortFieldToOrder.clear();
			result.sortOrders
				.split(' ')
				.map((sortOrder) => LanguageLine.handleSort(sortOrder))
				.forEach((res) => {
					if (!(res instanceof Error)) {
						newLangLine.sortFieldToOrder.set(res.field, res.order);
					}
				});
			todoList.setLanguageLine(newLangLine);
			todoList.sort();
			update(mdView, [{ from, to, text: todoList.toString() }], listLine.number, true);
		}).open();
	} else {
		console.error('ActionType.EDIT has no implementation for action:', action);
	}

	return true;
}
