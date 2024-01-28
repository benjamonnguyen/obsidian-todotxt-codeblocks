import { MarkdownView, TFile } from 'obsidian';
import { Level, notice } from './notice';
import { findLine } from './documentUtil';
import { TodoItem, TodoList } from './model';
import { update } from './stateEditor';
import { EditorView } from '@codemirror/view';

const SOURCEPATH_TO_LISTID = new Map<string, string>();

export async function readFromFile(path: string): Promise<string | Error> {
	const file = app.vault.getAbstractFileByPath(path) as TFile;
	if (file) {
		return app.vault.cachedRead(file);
	} else {
		try {
			await app.vault.create(path, '');
		} catch (_) {
			return new Error('missing folder(s) in path: ' + path);
		}
		return '';
	}
}

export function writeToFile(path: string, data: string) {
	const file = app.vault.getAbstractFileByPath(path) as TFile;
	if (file) {
		app.vault.modify(file, data);
	} else {
		app.vault
			.create(path, data)
			.catch(() =>
				notice('failed write to *.txt file: missing folder(s) in path: ' + path, Level.ERR, 10000),
			);
	}
}

export function link(srcPath: string, listId: string) {
	SOURCEPATH_TO_LISTID.set(srcPath, listId);
}

export async function synchronize() {
	const cm = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor.cm as EditorView;
	for (const [src, id] of SOURCEPATH_TO_LISTID) {
		const el = document.getElementById(id);
		if (!el) return;
		const line = findLine(el, cm);
		const { from, to, todoList } = TodoList.from(line.number, cm);
		const langLine = todoList.languageLine();
		const codeblock = todoList
			.items()
			.map((item) => item.toString())
			.join('\n');
		const fileRes = await readFromFile(src);
		if (fileRes instanceof Error) {
			SOURCEPATH_TO_LISTID.delete(src);
			return;
		}
		if (codeblock != fileRes) {
			const newTodoList = new TodoList(
				langLine,
				fileRes
					.split('\n')
					.filter((line) => !!line)
					.map((line) => new TodoItem(line)),
			);
			newTodoList.sort();
			update(from, to, newTodoList);
			notice(`synchronized ${langLine.title} with linked file: ${src}`, Level.INFO);
		}
	}
}
