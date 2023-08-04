import { TodoItem, ProjectGroupContainer } from ".";
import { randomUUID } from "crypto";
import { TodoLanguageLine } from ".";

export class TodoList implements ViewModel {
    static HTML_CLS = "todotxt-list";

    private id: string;
    langLine: TodoLanguageLine;
    items: TodoItem[] = [];
    projectGroups: ProjectGroupContainer[] = [];

    constructor(langLine: TodoLanguageLine, items: TodoItem[]) {
        this.id = `${randomUUID()}`;
        this.langLine = langLine;
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
                this.items.push(item);
            }
        });
        for (const [proj, items] of projToItems.entries()) {
            this.projectGroups.push(
                new ProjectGroupContainer(proj, items,
                    this.langLine.toggledProjects.has(proj.toLowerCase())));
        }
        // console.log(langLine, this.projectGroups);
    }

    render(): HTMLElement {
        const list = document.createElement("div");
        list.addClass(this.getHtmlCls());
        list.id = this.id;

        list.appendChild(this.langLine.render());

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
