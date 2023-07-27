import { MarkdownPostProcessorContext } from "obsidian";

function handle(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
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
    el.createSpan({text: title, cls: "todotext-md-title"});
    const body = el.createDiv({cls: "todotext-md-list"});
    for (const [i, item] of source.split("\n").entries()) {
        // TODO parse items to get prio, dueDate, completionDate, tags, contexts
        body.innerHTML += `<input type="checkbox" id="todotxt-item-${i}"/><label for="todotxt-item-${i}">${item}</label><br>`;
    }

    console.log(el);
}

export default handle;