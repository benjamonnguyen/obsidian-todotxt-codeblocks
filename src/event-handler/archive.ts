import { MarkdownView, TFile, moment } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { SETTINGS_READ_ONLY } from 'src/main';
import { ActionType, TodoItem, TodoList } from 'src/model';
import { notice, Level } from 'src/notice';
import { findLine, updateView } from 'src/stateEditor';
import { deleteCompletedTasksModal, deleteTasks } from './delete';

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
		// @ts-ignore
		const listLine = findLine(target, mdView.editor.cm as EditorView);
		archiveOrDeleteCompletedTasksModal(listLine.number, mdView).open();
	} else {
		console.error('ActionType.ARCHIVE has no implementation for action:', action);
	}

	return true;
}

export function archiveOrDeleteCompletedTasksModal(
	listLine: number,
	mdView: MarkdownView,
): ConfirmModal {
	const archiveBehavior = SETTINGS_READ_ONLY.archiveBehavior;
	if (archiveBehavior === 'archive') {
		return new ConfirmModal(
			mdView.app,
			'Archive completed tasks?',
			'Completed tasks will be moved to archive.todotxt',
			async () =>
				archiveTasks((item) => item.complete(), mdView, listLine).then((items) =>
					notice(`Moved ${items.length} completed tasks to archive.todotxt`, Level.INFO),
				),
		);
	} else if (archiveBehavior === 'delete') {
		return deleteCompletedTasksModal(listLine, mdView);
	} else {
		throw new Error('No implementation for archiveBehavior: ' + archiveBehavior);
	}
}

export async function archiveTasks(
	predicate: (item: TodoItem) => boolean,
	mdView: MarkdownView,
	...listLines: number[]
): Promise<TodoItem[]> {
	const archivedItems: TodoItem[] = [];
	const archiveFile =
		(mdView.app.vault.getAbstractFileByPath('archive.todotxt') as TFile) ||
		(await mdView.app.vault.create('archive.todotxt', ''));
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;

	listLines.forEach((line) => {
		const { from, to, todoList } = TodoList.from(line, view);
		archivedItems.push(...todoList.removeItems(predicate));
		if (archivedItems.length) {
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
		}
	});

	mdView.app.vault.process(archiveFile, (data) => {
		const res: string[] = [];
		if (data) {
			res.push(data);
		}
		archivedItems.forEach((item) => res.push(item.toString()));

		return res.join('\n');
	});

	return archivedItems;
}

export function autoArchive(mdView: MarkdownView | null) {
	const autoArchiveThreshold = SETTINGS_READ_ONLY.autoArchiveThreshold;
	if (!mdView || autoArchiveThreshold === -1) return;

	const listEls = document.getElementsByClassName(TodoList.HTML_CLS);
	const listLines = Array.from(listEls).map(
		(target) =>
			// @ts-ignore
			findLine(target, mdView.editor.cm as EditorView).number,
	);
	const predicate = (item: TodoItem) =>
		item.completed() !== null &&
		moment().diff(moment(item.completed()), 'd') >= autoArchiveThreshold;
	let removedTasks: Promise<TodoItem[]>;
	const archiveBehavior = SETTINGS_READ_ONLY.archiveBehavior;
	if (archiveBehavior === 'archive') {
		removedTasks = archiveTasks(predicate, mdView, ...listLines);
	} else if (archiveBehavior === 'delete') {
		removedTasks = deleteTasks(predicate, mdView, ...listLines);
	} else {
		throw new Error('No implementation for archiveBehavior: ' + archiveBehavior);
	}
	removedTasks.then((items) => notice(`Auto-archived ${items.length} items`, Level.INFO));
}
