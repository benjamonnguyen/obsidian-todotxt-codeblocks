import { MarkdownView, TFile, moment } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { SETTINGS_READ_ONLY } from 'src/main';
import { ActionType, TodoItem, TodoList } from 'src/model';
import { notice, Level } from 'src/notice';
import { deleteCompletedTasksModal, deleteTasks } from './delete';
import { update } from 'src/stateEditor';

export function clickArchive(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;

	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const newTarget = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	if (!newTarget || newTarget.getAttr('action-type') !== ActionType.ARCHIVE.name) {
		return false;
	}
	archiveOrDeleteCompletedTasksModal(target).open();

	return true;
}

export function archiveOrDeleteCompletedTasksModal(listEl: Element): ConfirmModal {
	const archiveBehavior = SETTINGS_READ_ONLY.archiveBehavior;
	if (archiveBehavior === 'archive') {
		return new ConfirmModal(
			app,
			'Archive completed tasks?',
			'Completed tasks will be moved to archive.txt',
			() => archiveTasks((item) => item.complete(), listEl),
		);
	} else if (archiveBehavior === 'delete') {
		return deleteCompletedTasksModal(listEl);
	} else {
		throw new Error('No implementation for archiveBehavior: ' + archiveBehavior);
	}
}

export async function archiveTasks(
	predicate: (item: TodoItem) => boolean,
	...listEls: Element[]
): Promise<void> {
	const f = await archivalFile();
	if (!f) return;

	const archivedItems: TodoItem[] = [];
	listEls.forEach((el) => {
		const { from, to, todoList } = TodoList.from(el);
		archivedItems.push(...todoList.removeItems(predicate));
		if (archivedItems.length) {
			update(from, to, todoList);
		}
	});

	app.vault.process(f, (data) => {
		const res: string[] = [];
		if (data) {
			res.push(data);
		}
		archivedItems.forEach((item) => res.push(item.toString()));

		return res.join('\n');
	});

	notice(`Moved ${archivedItems.length} completed task(s) to ${f.path}`, Level.INFO);
}

async function archivalFile(): Promise<TFile | undefined> {
	const path = SETTINGS_READ_ONLY.archiveFilePath;

	// must use txt extension
	if (!path.endsWith('.txt')) {
		notice('archive file path must use txt extension', Level.ERR, 10000);
		return;
	}

	//
	const file = app.vault.getAbstractFileByPath(path) as TFile;
	if (file) return file;

	// create folders if not exist
	const lastSlash = path.lastIndexOf('/');
	if (lastSlash >= 0) {
		await app.vault.createFolder(path.substring(0, lastSlash));
	}

	// create file
	try {
		return await app.vault.create(path, '');
	} catch (e) {
		console.error(e);
		notice('invalid archive file path: ' + path, Level.ERR, 10000);
	}
}

export function autoArchive(mdView: MarkdownView | null) {
	const autoArchiveThreshold = SETTINGS_READ_ONLY.autoArchiveThreshold;
	if (!mdView || autoArchiveThreshold === -1) return;

	const listEls = Array.from(mdView.contentEl.getElementsByClassName(TodoList.HTML_CLS));
	const predicate = (item: TodoItem) =>
		item.completed() !== null &&
		moment().diff(moment(item.completed()), 'd') >= autoArchiveThreshold;
	const archiveBehavior = SETTINGS_READ_ONLY.archiveBehavior;
	if (archiveBehavior === 'archive') {
		archiveTasks(predicate, ...listEls);
	} else if (archiveBehavior === 'delete') {
		deleteTasks(predicate, ...listEls).then((items) => {
			if (items) {
				notice(`Auto-deleted ${items.length} completed task(s)`, Level.INFO);
			}
		});
	} else {
		throw new Error('No implementation for archiveBehavior: ' + archiveBehavior);
	}
}
