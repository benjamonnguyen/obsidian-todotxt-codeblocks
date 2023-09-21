import { MarkdownView } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { ConfirmModal } from 'src/component';
import { ActionType, LanguageLine, TodoItem } from 'src/model';
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
		const deleteItem = async () => {
			const line = findLine(newTarget, view);
			const listEl = newTarget.matchParent('.' + TodoList.HTML_CLS);
			let listLine = 0;
			if (listEl) {
				listLine = findLine(listEl, view).number;
			}
			update(mdView, [{ from: line.from, to: line.to + 1 }], listLine); // +1 to delete entire line
		};
		// @ts-ignore
		if (mdView.app.isMobile) {
			new ConfirmModal(mdView.app, 'Delete task?', '', deleteItem).open();
		} else {
			deleteItem();
		}
	} else if (action === 'todotxt-delete-list') {
		new ConfirmModal(mdView.app, 'Remove Todo.txt codeblock?', '', () => {
			const listLine = findLine(newTarget, view);
			const { langLine } = LanguageLine.from(listLine.text);
			for (let i = listLine.number; i < view.state.doc.lines; i++) {
				const l = view.state.doc.line(i);
				if (l.text.trimEnd() === '```') {
					update(mdView, [{ from: listLine.from, to: l.to + 1 }], listLine.number);
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
			update(mdView, [{ from, to, text: todoList.toString() }], line);
		}
	});

	return deletedItems;
}
