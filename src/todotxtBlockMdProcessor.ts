import { MarkdownPostProcessorContext } from "obsidian";
import { TodoItem, TodoListTitle, TodoList } from "./viewModels";

export const UNSAVED_TODO_ITEM_IDS: string[] = [];

export function todotxtBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Parse language line
    const info = ctx.getSectionInfo(el)!;
    let languageLine = info.text.split("\n", info.lineStart + 1).last()!;

    const title = new TodoListTitle(languageLine);
    if (languageLine !== title.toString()) {
        UNSAVED_TODO_ITEM_IDS.push(title.getId());
    }
    el.appendChild(title.render());

    const items: TodoItem[] = [];
    for (const [i, line] of source.split("\n").entries()) {
        if (line.trim()) {
            const item = new TodoItem(line);
            items.push(item);
            if (line !== item.toString()) {
                UNSAVED_TODO_ITEM_IDS.push(item.getId());
            }
        }
    }
    el.appendChild(new TodoList(items).render());
}