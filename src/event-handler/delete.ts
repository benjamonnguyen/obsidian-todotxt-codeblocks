import { MarkdownView } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { ActionType, TodoItem } from 'src/model';
import { findLine, updateView } from 'src/stateEditor';
import { TodoList } from 'src/model';
import { notice, Level } from 'src/notice';
import { archiveOrDeleteCompletedTasksModal } from './archive';

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
		const deleteItem = async () => {
			const line = findLine(newTarget, view);
			updateView(mdView, [{ from: line.from, to: line.to + 1 }]); // +1 to delete entire line
		};
		// @ts-ignore
		if (mdView.app.isMobile) {
			new ConfirmModal(mdView.app, 'Delete task?', '', deleteItem).open();
		} else {
			deleteItem();
		}
	} else if (action === 'todotxt-delete-items') {
		archiveOrDeleteCompletedTasksModal(findLine(target, view).number, mdView).open();
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
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
		}
	});

	return deletedItems;
}
