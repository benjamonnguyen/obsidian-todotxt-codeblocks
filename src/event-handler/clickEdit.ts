import { MarkdownView } from 'obsidian';
import { EditItemModal, EditListOptionsModal } from 'src/component';
import { ActionType, TodoList, TodoItem, LanguageLine } from 'src/model';
import { updateView } from 'src/stateEditor';

export default function clickEdit(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;

	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const editBtnEl = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	if (!editBtnEl || editBtnEl.getAttr('action') !== ActionType.EDIT.name) {
		return false;
	}
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const pos = view.posAtDOM(editBtnEl);
	const listLine = view.state.doc.lineAt(pos);
	const { todoList, from, to } = TodoList.from(listLine.number, view);

	if (editBtnEl.id === EditItemModal.ID) {
		const itemId = editBtnEl.getAttr('item-id')?.match(/\d+$/)?.first();
		if (!itemId) {
			console.error('EditBtn element has invalid item-id: ' + editBtnEl.getAttr('item-id'));
			return true;
		}
		const itemIdx = parseInt(itemId);
		const item = new TodoItem(view.state.doc.line(listLine.number + 1 + itemIdx).text);

		new EditItemModal(mdView.app, item, todoList, (result) => {
			todoList.items[itemIdx] = result;
			todoList.sort();
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
		}).open();
	} else if (editBtnEl.id === EditListOptionsModal.ID) {
		const { langLine } = LanguageLine.from(listLine.text);

		new EditListOptionsModal(this.app, langLine, (result) => {
			todoList.langLine.title = result.title;
			todoList.langLine.sortFieldToOrder.clear();
			result.sortOrders
				.split(' ')
				.map((sortOrder) => LanguageLine.handleSort(sortOrder))
				.forEach((res) => {
					if (!(res instanceof Error)) {
						todoList.langLine.sortFieldToOrder.set(res.field, res.order);
					}
				});
			todoList.sort();
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
		}).open();
	}

	return true;
}
