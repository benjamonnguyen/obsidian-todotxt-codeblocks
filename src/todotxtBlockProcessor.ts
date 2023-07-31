import { MarkdownPostProcessorContext } from "obsidian";
import { TodoItem } from "./TodoItem";

export function todotxtBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Parse language line
    const info = ctx.getSectionInfo(el)!;
    var languageLine = info.text.split("\n", info.lineStart + 1).last()?.split(" ")!;
    var title = "TODO";
    const sortKVs: String[] = [];
    const filterKVs: String[] = [];
    for (const [i, str] of languageLine.entries()) {
        if (str.startsWith("sort:")) {
            sortKVs.push(str.substring(4));
        } else if (str.startsWith("filter:")) {
            filterKVs.push(str.substring(6));
        } else if (i === 1) {
            title = str;
        }
    }
    // Construct el
    // TODO handle sort/filter
    el.createEl("h1", {text: title, cls: "todotext-md-title"});
    const list = el.createDiv({cls: "todotext-md-list"});
    for (const [i, line] of source.split("\n").entries()) {
        const item = new TodoItem(line);
        list.innerHTML += `<span class="todotxt-md-item" id="todotxt-item-${i}">
        <input type="checkbox" ${item.complete() ? "checked" : "unchecked"}>${item.toString()}</span><br>`;
    }
}