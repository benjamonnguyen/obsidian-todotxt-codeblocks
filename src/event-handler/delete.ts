import { MarkdownView } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { ConfirmModal } from 'src/component';
import { ActionType, LanguageLine, TodoItem } from 'src/model';
import { findLine, updateDocument } from 'src/documentUtil';
import { TodoList } from 'src/model';
import { notice, Level } from 'src/notice';

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
			updateDocument(mdView, [{ from: line.from, to: line.to + 1 }]); // +1 to delete entire line
		};
		// @ts-ignore
		if (mdView.app.isMobile) {
			new ConfirmModal(mdView.app, 'Delete task?', '', deleteItem).open();
		} else {
			deleteItem();
		}
	} else if (action === 'todotxt-delete-list') {
		new ConfirmModal(mdView.app, 'Remove Todo.txt codeblock?', '', () => {
			const line = findLine(newTarget, view);
			const { langLine } = LanguageLine.from(line.text);
			for (let i = line.number; i < view.state.doc.lines; i++) {
				const l = view.state.doc.line(i);
				if (l.text.trimEnd() === '```') {
					updateDocument(mdView, [{ from: line.from, to: l.to + 1 }]);
					notice(`Removed Todo.txt codeblock: ${langLine.title} `, Level.INFO);
					return;
				}
			}
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
			updateDocument(mdView, [{ from, to, insert: todoList.toString() }]);
		}
	});

	return deletedItems;
}
