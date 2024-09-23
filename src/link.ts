import { TFile } from 'obsidian';
import { Level, notice } from './notice';
import { TodoItem, TodoList } from './model';
import { UpdateOption, update } from './stateEditor';

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

export async function synchronize(): Promise<boolean> {
	const srcPathToTodoListEls = new Map<string, Element[]>();
	const listEls = document.querySelectorAll(`div.block-language-todotxt .${TodoList.HTML_CLS}`);
	listEls.forEach(el => {
		const { todoList } = TodoList.from(el);
		const { sourcePath } = todoList.languageLine();
		if (!sourcePath) {
			return;
		}
		if (!srcPathToTodoListEls.has(sourcePath)) {
			srcPathToTodoListEls.set(sourcePath, []);
		}
		srcPathToTodoListEls.get(sourcePath)!.push(el);
	});

	let synced = false;
	for (const [srcPath, todoListEls] of srcPathToTodoListEls) {
		const fileRes = await readFromFile(srcPath);
		if (fileRes instanceof Error) {
			console.error(fileRes);
			continue;
		}
		for (const el of todoListEls) {
			const { from, to, todoList } = TodoList.from(el);
			const codeblock = todoList
				.items()
				.map((item) => item.toString())
				.join('\n');
			if (codeblock !== fileRes) {
				synced = true;
				const newTodoList: TodoList = new TodoList(
					todoList.languageLine(),
					fileRes
						.split('\n')
						.filter((line) => !!line)
						.map((line) => new TodoItem(line)),
				);
				newTodoList.sort();
				const newCodeblock = newTodoList
					.items()
					.map((item) => item.toString())
					.join('\n');
				if (newCodeblock !== codeblock) {
					update(from, to, newTodoList);
				} else {
					update(from, to, newTodoList, UpdateOption.NO_WRITE);
				}
				notice(`synchronized ${newTodoList.languageLine().title} with linked file: ${srcPath}`, Level.INFO);
			}
		}
	}
	return synced;
}
