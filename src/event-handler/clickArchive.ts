import { MarkdownView, TFile } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { SETTINGS_READ_ONLY } from 'src/main';
import { ActionType, TodoList } from 'src/model';
import { notice, Level } from 'src/notice';
import { findLine, updateView } from 'src/stateEditor';
import { handleDelete } from './clickDelete';

export function clickArchive(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;

	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const newTarget = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	if (!newTarget || newTarget.getAttr('action-type') !== ActionType.ARCHIVE.name) {
		return false;
	}

	const action = newTarget.getAttr('action');
	if (action === 'todotxt-archive-items') {
		// Handle cases where the archive button has not re-rendered
		if (SETTINGS_READ_ONLY.archiveBehavior === 'archive') {
			handleArchive(newTarget, mdView);
		} else if (SETTINGS_READ_ONLY.archiveBehavior === 'delete') {
			handleDelete(newTarget, mdView);
		}
	} else {
		console.error('ActionType.ARCHIVE has no implementation for action:', action);
	}

	return true;
}

export function handleArchive(target: SVGElement | HTMLElement, mdView: MarkdownView) {
	new ConfirmModal(
		mdView.app,
		'Archive completed tasks?',
		'Completed tasks will be moved to archive.todotxt',
		async () => {
			// @ts-ignore
			const view = mdView.editor.cm as EditorView;
			const line = findLine(target, view);
			const { from, to, todoList } = TodoList.from(line.number, view);
			const completedItems = todoList.removeItems((item) => item.complete());
			const archiveFile =
				(mdView.app.vault.getAbstractFileByPath('archive.todotxt') as TFile) ||
				(await mdView.app.vault.create('archive.todotxt', ''));
			mdView.app.vault.process(archiveFile, (data) => {
				const res: string[] = [];
				if (data) {
					res.push(data);
				}
				completedItems.forEach((item) => res.push(item.toString()));

				return res.join('\n');
			});
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
			notice(`Moved ${completedItems.length} completed tasks to archive.todotxt`, Level.INFO);
		},
	).open();
}
