import { MarkdownPostProcessorContext } from "obsidian";
import { TodoItem } from "./TodoItem";
import { moment } from "obsidian";
import { randomUUID } from "crypto";

const TITLE_REGEX = /^```todotxt (?="([^"]+)"|((?!sort:|filter:)\S+))/;

export const UNSAVED_TODO_ITEM_IDS: string[] = [];

export function todotxtBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Parse language line
    const info = ctx.getSectionInfo(el)!;
    var languageLine = info.text.split("\n", info.lineStart + 1).last()!;
    const match = TITLE_REGEX.exec(languageLine);
    // console.log(match);
    const title = match?.at(1) || match?.at(2) || `Todo.txt (${moment().format("YYYY-MM-DD")})`;
    // const sortKVs: String[] = [];
    // const filterKVs: String[] = [];
    // for (const [i, str] of languageLine.split(" ").entries()) {
    //     if (str.startsWith("sort:")) {
    //         sortKVs.push(str.substring(4));
    //     } else if (str.startsWith("filter:")) {
    //         filterKVs.push(str.substring(6));
    //     }
    // }
    // Construct el
    // TODO handle sort/filter
    el.createEl("h1", {text: title, cls: "todotext-md-title"});

    const spans: string[] = [];
    for (const [i, line] of source.split("\n").entries()) {
        if (line.trim()) {
            const item = new TodoItem(line);
            const id = `todotxt-item-${randomUUID()}-${i}`;
            spans.push(`<span class="todotxt-md-item" id="${id}">
                <input type="checkbox" ${item.complete() ? "checked" : "unchecked"}>${item.toString()}</span>`);
            if (line !== item.toString()) {
                UNSAVED_TODO_ITEM_IDS.push(id);
            }
        }
    }
    el.createDiv({cls: "todotext-md-list"}).innerHTML = spans.join("<br>");
}