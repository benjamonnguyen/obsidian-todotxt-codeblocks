import { MarkdownPostProcessorContext } from "obsidian";
import { TodoLanguageLine, TodoList, TodoItem } from "./model";

export const UNSAVED_TODO_ITEM_IDS: string[] = [];

export function todotxtBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Parse language line
    const info = ctx.getSectionInfo(el)!;
    let languageLine = info.text.split("\n", info.lineStart + 1).last()!;

    const langLine = new TodoLanguageLine(languageLine);
    if (languageLine !== langLine.toString()) {
        UNSAVED_TODO_ITEM_IDS.push(langLine.getId());
    }

    const items: TodoItem[] = [];
    for (const [i, line] of source.split("\n").entries()) {
        if (line.trim()) {
            const item = new TodoItem(line, i);
            items.push(item);
            if (line !== item.toString()) {
                UNSAVED_TODO_ITEM_IDS.push(item.getId());
            }
        }
    }
    el.appendChild(new TodoList(langLine, items).render());
}
