import { MarkdownView } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { ActionType, TodoItem } from 'src/model';
import { TodoList } from 'src/model';
import { notice, Level } from 'src/notice';
import { UpdateOption, update } from 'src/stateEditor';

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
			const { from, to, todoList } = TodoList.from(listEl);
			todoList.removeItem(parseInt(itemIdx));
			update(from, to, todoList);
		};
		// @ts-ignore
		if (app.isMobile) {
			new ConfirmModal(mdView.app, 'Delete task?', '', deleteItem).open();
		} else {
			deleteItem();
		}
	} else if (action === 'todotxt-delete-list') {
		new ConfirmModal(app, 'Remove Todo.txt codeblock?', '', () => {
			const listEl = newTarget.matchParent('.' + TodoList.HTML_CLS);
			if (!listEl) {
				notice('Cannot find todoList', Level.ERR);
				return;
			}
			const { from, to, todoList } = TodoList.from(listEl);
			update(from, to, todoList, UpdateOption.DELETE);
			notice(`Removed Todo.txt codeblock: ${todoList.languageLine().title} `, Level.INFO);
			return;
		}).open();
	} else {
		console.error('ActionType.DEL has no implementation for action:', action);
	}

	return true;
}

export function deleteCompletedTasksModal(listEl: Element): ConfirmModal {
	return new ConfirmModal(
		app,
		'Delete completed tasks?',
		'Completed tasks will be permanently deleted',
		async () =>
			deleteTasks((item) => item.complete(), listEl).then((items) =>
				notice(`Deleted ${items.length} completed tasks`, Level.INFO),
			),
	);
}

export async function deleteTasks(
	predicate: (item: TodoItem) => boolean,
	...listEls: Element[]
): Promise<TodoItem[]> {
	const deletedItems: TodoItem[] = [];

	listEls.forEach((el) => {
		const { from, to, todoList } = TodoList.from(el);
		const removedItems = todoList.removeItems(predicate);
		if (removedItems.length) {
			deletedItems.push(...removedItems);
			update(from, to, todoList);
		}
	});

	return deletedItems;
}
