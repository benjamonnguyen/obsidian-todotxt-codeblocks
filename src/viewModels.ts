import { Item } from "jstodotxt";
import { moment } from "obsidian";
import { randomUUID } from "crypto";

interface ViewModel {
    render(): HTMLElement;
    toString(): string;
    getId(): string;
    getHtmlCls(): string;
}

export class TodoItem extends Item implements ViewModel {
    static HTML_CLS = "todotxt-item";

    private id: string;

    constructor(line: string, idx: number | undefined = undefined) {
        super(line);
        this.id = `${randomUUID()}-${idx}`;
        if (!this.created()) {
            this.setCreated(new Date());
        }
    }

    render(): HTMLElement {
        const item = document.createElement("span");
        item.addClass(this.getHtmlCls());
        item.id = this.id;

        const checkbox = item.createEl("input", {
            type: "checkbox",
            cls: "task-list-item-checkbox",
        });
        checkbox.setAttr(this.complete() ? "checked" : "unchecked", true);

        if (this.priority()) {
            item.createSpan({
                cls: this.getPriorityHtmlClasses(),
                text: this.priority()!,
            });
        }

        item.createSpan({
            cls: "todotxt-item-description",
            text: this.body(),
        });

        // TODO TodoContext/TodoProject

        return item;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return TodoItem.HTML_CLS;
    }

    private getPriorityHtmlClasses(): string[] {
        let letterCls;
        switch (this.priority()?.toLowerCase()) {
            case "a":
                letterCls = "todotxt-priority-a";
                break;
            case "b":
                letterCls = "todotxt-priority-b";
                break;
            case "c":
                letterCls = "todotxt-priority-c";
                break;
            default:
                letterCls = "todotxt-priority-x";
        }

        return [letterCls, "todotxt-priority"];
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
        const title = document.createElement("h3");
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