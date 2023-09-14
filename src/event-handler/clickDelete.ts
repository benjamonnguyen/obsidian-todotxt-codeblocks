import { MarkdownView } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { ActionType } from 'src/model';
import { findLine, updateView } from 'src/stateEditor';
import { TodoList } from 'src/model';
import { notice, Level } from 'src/notice';
import { SETTINGS_READ_ONLY } from 'src/main';
import { handleArchive } from './clickArchive';

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
		const deleteItem = async () => {
			// @ts-ignore
			const view = mdView.editor.cm as EditorView;
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
		// Handle cases where the archive button has not re-rendered
		if (SETTINGS_READ_ONLY.archiveBehavior === 'archive') {
			handleArchive(newTarget, mdView);
		} else if (SETTINGS_READ_ONLY.archiveBehavior === 'delete') {
			handleDelete(newTarget, mdView);
		}
	} else {
		console.error('ActionType.DEL has no implementation for action:', action);
	}

	return true;
}

export function handleDelete(target: SVGElement | HTMLElement, mdView: MarkdownView) {
	new ConfirmModal(
		mdView.app,
		'Delete completed tasks?',
		'Completed tasks will be permanently deleted',
		async () => {
			// @ts-ignore
			const view = mdView.editor.cm as EditorView;
			const line = findLine(target, view);
			const { from, to, todoList } = TodoList.from(line.number, view);
			todoList.removeItems((item) => item.complete());
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
			notice(`Deleted completed tasks`, Level.INFO);
		},
	).open();
}
