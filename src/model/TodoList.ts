import { TodoItem, ProjectGroupContainer } from ".";
import { randomUUID } from "crypto";
import { moment } from "obsidian";

export class TodoList implements ViewModel {
    static HTML_CLS = "todotxt-list";

    private id: string;
    items: TodoItem[] = [];
    projectGroups: ProjectGroupContainer[] = [];

    constructor(items: TodoItem[]) {
        this.id = `${randomUUID()}`;

        // Create ProjectGroups
        const projToItems: Map<string, TodoItem[]> = new Map();
        items.forEach(item => {
            if (item.projects().length) {
                item.projects().forEach(proj => {
                    const items = projToItems.get(proj);
                    if (items) {
                        items.push(item);
                    } else {
                        projToItems.set(proj, [item]);
                    }
                })
            } else {
                // default group.
                this.items.push(item);
            }
        });
        for (const [proj, items] of projToItems.entries()) {
            this.projectGroups.push(new ProjectGroupContainer(proj, items));
        }

    }

    render(): HTMLElement {
        const list = document.createElement("div");
        list.addClass(this.getHtmlCls());
        list.id = this.id;

        list.innerHTML += this.items.map(item =>
            item.render().outerHTML).join("<br>");

        this.projectGroups.forEach(group => list.appendChild(group.render()));

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
