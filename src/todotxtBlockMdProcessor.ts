import { MarkdownPostProcessorContext, Notice } from "obsidian";
import { LanguageLine, TodoList } from "./model";
import MyPlugin from "./main";

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
        new Notice(MyPlugin.NAME + " ERROR\n" + errMsg, 15000);
    }

    // Create todo list and update editor state.
    const todoList = new TodoList(langLine, source);

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
