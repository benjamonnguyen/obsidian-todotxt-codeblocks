import { MarkdownPostProcessorContext } from "obsidian";
import { TodoItem } from "./TodoItem";

export default function handle(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        // Parse language line
        const info = ctx.getSectionInfo(el)!;
        var languageLine = info.text.split("\n", info.lineStart + 1).last()?.split(" ")!;
        var title = "TODO";
        const sortStrings: string[] = [];
        const filterStrings: string[] = [];
        for (const [i, str] of languageLine.entries()) {
            if (str.startsWith("sort:")) {
                sortStrings.push(str.substring(4));
            } else if (str.startsWith("filter:")) {
                filterStrings.push(str.substring(6));
            } else if (i === 1) {
                title = str;
            }
        }
        el.createSpan({text: title, cls: "todotxt-md-title"});
    
        // Parse todo items
        const todoList = source.split("\n")
            .map(token => new TodoItem(token))
            // TODO sort/filter
            // .filter(item => this.filterTodoItem(item, filterOptions))
            // .sort(this.sortTodoItems)
    
        // Build el
        const body = el.createDiv({cls: "todotxt-md-list"});
        for (const [i, item] of todoList.entries()) {
            console.log(item.toAnnotatedString());
            body.innerHTML += `<input type="checkbox" id="todotxt-item-${i}"/><label for="todotxt-item-${i}">${item.toString()}</label><br>`
        }

        console.log(el);
    }

// function _filterTodoItem(item: TodoItem, filterConditions: Map<String, Field>): boolean {

// }

// function _sortTodoItems(a: TodoItem, b: TodoItem): number {
    
// }