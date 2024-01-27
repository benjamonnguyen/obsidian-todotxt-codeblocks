/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MarkdownPostProcessorContext } from 'obsidian';
import { LanguageLine, TodoList, TodoItem } from './model';
import { notice, Level } from './notice';
import { SOURCEPATH_TO_LISTID } from './link';

export function todotxtBlockProcessor(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
) {
	const info = ctx.getSectionInfo(el)!;

	// Parse language line.
	const languageLine = info.text.split('\n', info.lineStart + 1).last()!;
	const { langLine, errors: errs } = LanguageLine.from(languageLine);
	if (errs.length) {
		let errMsg = '';
		errs.forEach((e) => (errMsg += `- ${e.message}\n`));
		notice(errMsg, Level.ERR, 15000);
	}

	// Render todo list
	const lines = source.split('\n');
	const items = lines.filter((line) => line.trim().length).map((line) => new TodoItem(line));
	const todoList = new TodoList(langLine, items);
	el.appendChild(todoList.render());

	// Register links
	if (langLine.source) {
		SOURCEPATH_TO_LISTID.set(langLine.source, todoList.getId());
	}
}
