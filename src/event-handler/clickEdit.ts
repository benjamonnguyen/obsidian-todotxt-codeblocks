import { MarkdownView } from 'obsidian';
import { EditItemModal, EditListOptionsModal } from 'src/component';
import { TodoList, TodoItem, LanguageLine } from 'src/model';
import { updateView } from 'src/stateEditor';
import { ActionType } from 'src/model';

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
		const item = new TodoItem(view.state.doc.line(listLine.number + 1 + itemIdx).text);

		new EditItemModal(mdView.app, item, todoList, (result) => {
			todoList.items()[itemIdx] = result;
			todoList.sort();
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
		}).open();
	} else if (action === EditListOptionsModal.ID) {
		new EditListOptionsModal(this.app, todoList.languageLine(), (result) => {
			const langLine = todoList.languageLine();
			langLine.title = result.title;
			langLine.sortFieldToOrder.clear();
			result.sortOrders
				.split(' ')
				.map((sortOrder) => LanguageLine.handleSort(sortOrder))
				.forEach((res) => {
					if (!(res instanceof Error)) {
						langLine.sortFieldToOrder.set(res.field, res.order);
					}
				});
			todoList.setLanguageLine(langLine);
			todoList.sort();
			// Add newline to force codeblock to re-render
			updateView(mdView, [{ from, to, insert: todoList.toString() + '\n' }]);
		}).open();
	} else {
		console.error('ActionType.EDIT has no implementation for action:', action);
	}

	return true;
}
