import { MarkdownPostProcessorContext, MarkdownView } from 'obsidian';
import { LanguageLine, TodoList, TodoItem } from './model';
import { notice, Level } from './notice';
import { findLine, updateDocument } from './documentUtil';

// line 0 is langLine
const UNSAVED_ITEMS: { listId: string; line: number; newText?: string }[] = [];

export function todotxtBlockProcessor(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
) {
	// Parse language line.
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const info = ctx.getSectionInfo(el)!;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const languageLine = info.text.split('\n', info.lineStart + 1).last()!;
	const { langLine, errors: errs } = LanguageLine.from(languageLine);
	if (errs.length) {
		let errMsg = '';
		errs.forEach((e) => (errMsg += `- ${e.message}\n`));
		notice(errMsg, Level.ERR, 15000);
	}

	// Create todo list and update editor state.
	const items = source
		.split('\n')
		.filter((line) => line.trim().length)
		.map((line) => new TodoItem(line));
	const todoList = new TodoList(langLine, items);
	todoList.sort();

	const newLangLine = langLine.toString();
	if (languageLine !== newLangLine) {
		UNSAVED_ITEMS.push({ listId: todoList.getId(), line: 0, newText: newLangLine });
	}

	const lines = source.split('\n');
	for (const [i, line] of lines.entries()) {
		const newItem = todoList.items().at(i)?.toString();
		if (newItem) {
			if (line !== newItem) {
				UNSAVED_ITEMS.push({ listId: todoList.getId(), line: i + 1, newText: newItem });
			}
		} else if (lines.length > 1) {
			UNSAVED_ITEMS.push({ listId: todoList.getId(), line: i + 1 });
		}
	}

	// Render todo list.
	el.appendChild(todoList.render());
}

export function saveChanges(mdView: MarkdownView | null) {
	if (!mdView || !UNSAVED_ITEMS || !UNSAVED_ITEMS.length) return;
	// State changes do not persist to EditorView in Reading mode.
	if (mdView.getMode() === 'preview') return;
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;

	const items = [...UNSAVED_ITEMS];
	UNSAVED_ITEMS.length = 0;
	const changes: { from: number; to: number; insert?: string }[] = [];

	items.forEach(({ listId, line, newText }) => {
		const list = document.getElementById(listId);
		if (!list) return;
		const listLine = findLine(list, view);

		const itemLine = view.state.doc.line(listLine.number + line);
		if (newText) {
			changes.push({ from: itemLine.from, to: itemLine.to, insert: newText });
		} else {
			changes.push({ from: itemLine.from, to: itemLine.to + 1 });
		}
	});

	updateDocument(mdView, changes);
	let noticeMsg = 'Saving changes...\n';
	changes.filter((c) => c.insert).forEach((c) => (noticeMsg += `- ${c.insert}\n`));
	notice(noticeMsg, Level.INFO, 2500);
}
