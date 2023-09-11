import { MarkdownView, Notice, TFile } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { ActionType } from 'src/model';
import { findLine, updateView } from 'src/stateEditor';
import { TodoList } from 'src/model';
import TodotxtCodeblocksPlugin from 'src/main';

export default function clickDelete(event: MouseEvent, mdView: MarkdownView): boolean {
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
	} else if (action === 'todotxt-archive-items') {
		const archiveItems = async () => {
			// @ts-ignore
			const view = mdView.editor.cm as EditorView;
			const line = findLine(newTarget, view);
			const { from, to, todoList } = TodoList.from(line.number, view);
			const completedItems = todoList.items.filter((item) => item.complete());
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
			todoList.items = todoList.items.filter((item) => !item.complete());
			updateView(mdView, [{ from, to, insert: todoList.toString() }]);
			new Notice(
				`${TodotxtCodeblocksPlugin.NAME} INFO\nMoved ${completedItems.length} completed tasks to archive.todotxt`,
			);
		};

		new ConfirmModal(
			mdView.app,
			'Archive completed tasks?',
			'Completed tasks will be moved to archive.todotxt', // TODO setting to delete instead
			archiveItems,
		).open();
	} else {
		console.error('ActionType.DEL has no implementation for action:', action);
	}

	return true;
}
