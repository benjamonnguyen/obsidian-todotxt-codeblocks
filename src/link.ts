import { TFile } from 'obsidian';
import { Level, notice } from './notice';
import { TodoItem, TodoList } from './model';
import { update } from './stateEditor';

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

export async function writeToFile(path: string, data: string) {
	const file = app.vault.getAbstractFileByPath(path) as TFile;
	if (file) {
		await app.vault.modify(file, data);
	} else {
		try {
			await app.vault.create(path, data);
		} catch (_) {
			notice('failed write to *.txt file: missing folder(s) in path: ' + path, Level.ERR, 10000);
		}
	}
}

export function link(srcPath: string, listId: string) {
	SOURCEPATH_TO_LISTID.set(srcPath, listId);
}

export async function synchronize(): Promise<boolean> {
	for (const [src, id] of SOURCEPATH_TO_LISTID) {
		const el = document.getElementById(id);
		if (!el) return false;
		const { from, to, todoList } = TodoList.from(el);
		const langLine = todoList.languageLine();
		const codeblock = todoList
			.items()
			.map((item) => item.toString())
			.join('\n');
		const fileRes = await readFromFile(src);
		if (fileRes instanceof Error) {
			SOURCEPATH_TO_LISTID.delete(src);
			return false;
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
			return true;
		}
	}
	return false;
}
