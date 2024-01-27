import { MarkdownView } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { ConfirmModal } from 'src/component';
import { ActionType, TodoItem } from 'src/model';
import { findLine } from 'src/documentUtil';
import { TodoList } from 'src/model';
import { notice, Level } from 'src/notice';
import { update } from 'src/stateEditor';

export function clickDelete(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;

	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const newTarget = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	if (!newTarget || newTarget.getAttr('action-type') !== ActionType.DEL.name) {
		return false;
	}

	const action = newTarget.getAttr('action');
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	if (action === 'todotxt-delete-item') {
		const deleteItem = () => {
			const id = newTarget.matchParent('.' + TodoItem.HTML_CLS)?.id;
			const itemIdx = id?.match(TodoItem.ID_REGEX)?.at(1);
			if (!itemIdx) {
				notice('Item element has invalid id', Level.ERR);
				return;
			}
			const listEl = newTarget.matchParent('.' + TodoList.HTML_CLS);
			if (!listEl) {
				notice('Cannot find todoList', Level.ERR);
				return;
			}
			const line = findLine(listEl, view).number;
			const { from, to, todoList } = TodoList.from(line, view);
			todoList.removeItem(parseInt(itemIdx));
			update(from, to, todoList);
		};
		// @ts-ignore
		if (mdView.app.isMobile) {
			new ConfirmModal(mdView.app, 'Delete task?', '', deleteItem).open();
		} else {
			deleteItem();
		}
	} else if (action === 'todotxt-delete-list') {
		new ConfirmModal(mdView.app, 'Remove Todo.txt codeblock?', '', () => {
			const listEl = newTarget.matchParent('.' + TodoList.HTML_CLS);
			if (!listEl) {
				notice('Cannot find todoList', Level.ERR);
				return;
			}
			const line = findLine(listEl, view).number;
			const { from, to, todoList } = TodoList.from(line, view);
			update(from, to, todoList, true);
			notice(`Removed Todo.txt codeblock: ${todoList.languageLine().title} `, Level.INFO);
			return;
		}).open();
	} else {
		console.error('ActionType.DEL has no implementation for action:', action);
	}

	return true;
}

export function deleteCompletedTasksModal(listLine: number, mdView: MarkdownView): ConfirmModal {
	return new ConfirmModal(
		mdView.app,
		'Delete completed tasks?',
		'Completed tasks will be permanently deleted',
		async () =>
			deleteTasks((item) => item.complete(), mdView, listLine).then((items) =>
				notice(`Deleted ${items.length} completed tasks`, Level.INFO),
			),
	);
}

export async function deleteTasks(
	predicate: (item: TodoItem) => boolean,
	mdView: MarkdownView,
	...listLines: number[]
): Promise<TodoItem[]> {
	const deletedItems: TodoItem[] = [];
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;

	listLines.forEach((line) => {
		const { from, to, todoList } = TodoList.from(line, view);
		const removedItems = todoList.removeItems(predicate);
		if (removedItems.length) {
			deletedItems.push(...removedItems);
			update(from, to, todoList);
		}
	});

	return deletedItems;
}
