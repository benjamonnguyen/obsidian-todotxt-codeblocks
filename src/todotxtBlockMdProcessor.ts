import { MarkdownPostProcessorContext, Notice } from "obsidian";
import { LanguageLine, TodoList, TodoItem } from "./model";
import TodotxtCodeblocksPlugin from "./main";

// line 0 is langLine
export const UNSAVED_ITEMS: { listId: string, line: number, newText?: string }[] = [];

export function todotxtBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Parse language line.
    const info = ctx.getSectionInfo(el)!;
    let languageLine = info.text.split("\n", info.lineStart + 1).last()!;
    const { langLine, errs } = LanguageLine.from(languageLine);
    if (errs.length) {
        let errMsg = "";
        errs.forEach(e => errMsg += `- ${e.message}\n`);
        new Notice(TodotxtCodeblocksPlugin.NAME + " ERROR\n" + errMsg, 15000);
    }

    // Create todo list and update editor state.
    const items = source.split("\n")
        .filter(line => line.trim().length)
        .map(line => new TodoItem(line));
    const todoList = new TodoList(langLine, items);

    const newLangLine = langLine.toString();
    if (languageLine !== newLangLine) {
        UNSAVED_ITEMS.push({ listId: todoList.getId(), line: 0, newText: newLangLine });
    }

    for (const [ i, line ] of source.split("\n").entries()) {
        const newItem = todoList.items.at(i)?.toString();
        if (newItem) {
            if (line !== newItem) {
                UNSAVED_ITEMS.push({ listId: todoList.getId(), line: i + 1, newText: newItem });
            }
        } else {
            // Remove empty lines.
            UNSAVED_ITEMS.push({ listId: todoList.getId(), line: i + 1 });
        }
    }

    // Render todo list.
    el.appendChild(todoList.render());
}
