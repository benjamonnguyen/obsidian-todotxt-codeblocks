import { TodoItem } from ".";
import { randomUUID } from "crypto";
import { moment } from "obsidian";

export class TodoList implements ViewModel {
    static HTML_CLS = "todotxt-list";

    private id: string;
    items: TodoItem[];

    constructor(items: TodoItem[]) {
        this.id = `${randomUUID()}`;
        this.items = items;
    }

    render(): HTMLElement {
        const list = document.createElement("div");
        list.addClass(this.getHtmlCls());
        list.id = this.id;

        list.innerHTML = this.items.map(item =>
            item.render().outerHTML).join("<br>");

        return list;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return TodoList.HTML_CLS;
    }
}

export class TodoListTitle implements ViewModel {
    private static REGEX = /^```todotxt (?="([^"]+)"|((?!sort:|filter:)\S+))/;
    static HTML_CLS = "todotxt-list-title";

    private id: string;
    title: string;
    sortKVs: string[] = [];
    filterKVs: string[] = [];

    constructor(line: string) {
        const match = TodoListTitle.REGEX.exec(line);
        this.title = match?.at(1) || match?.at(2)
            || `Todo.txt (${moment().format("YYYY-MM-DD")})`;
        this.id = randomUUID();
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
    }

    render(): HTMLElement {
        const title = document.createElement("h2");
        title.id = this.id;
        title.addClass(this.getHtmlCls());
        title.setText(this.title);

        return title;
    }

    toString() {
        return `\`\`\`todotxt "${this.title}"`;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return TodoListTitle.HTML_CLS;
    }
}
