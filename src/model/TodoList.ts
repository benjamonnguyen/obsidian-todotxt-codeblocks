import { TodoItem, ProjectGroupContainer } from ".";
import { randomUUID } from "crypto";
import { TodoLanguageLine } from ".";

export class TodoList implements ViewModel {
    static HTML_CLS = "todotxt-list";

    private id: string;
    langLine: TodoLanguageLine;
    todos: TodoItem[] = [];
    projectGroups: ProjectGroupContainer[] = [];

    constructor(langLine: TodoLanguageLine, items: TodoItem[]) {
        this.id = `${randomUUID()}`;
        this.langLine = langLine;
        const projToItems: Map<string, TodoItem[]> = new Map();
        const completed: TodoItem[] = [];
        items.forEach(item => {
            if (item.projects().length) {
                item.projects().forEach(proj => {
                    const projItems = projToItems.get(proj);
                    if (projItems) {
                        projItems.push(item);
                    } else {
                        projToItems.set(proj, [item]);
                    }
                })
            } else if (item.complete()) {
                completed.push(item);
            } else {
                this.todos.push(item);
            }
        });
        for (const [proj, items] of projToItems.entries()) {
            this.projectGroups.push(
                new ProjectGroupContainer(proj, items,
                    this.langLine.toggledProjects.has(proj.toLowerCase())));
        }
        if (completed.length) {
            this.projectGroups.push(
                new ProjectGroupContainer("completed", completed,
                this.langLine.toggledProjects.has("completed"))
            );
        }
        // console.log(langLine, this.projectGroups);
    }

    render(): HTMLElement {
        const list = document.createElement("div");
        list.addClass(this.getHtmlCls());
        list.id = this.id;

        list.appendChild(this.langLine.render());

        list.innerHTML += this.todos.map(item =>
            item.render().outerHTML).join("<br>");

        let completed: ProjectGroupContainer | undefined;
        for (const group of this.projectGroups) {
            if (group.name === "completed") {
                // render this last.
                completed = group;
                continue;
            }
            list.appendChild(group.render())
        }
        this.projectGroups.forEach(group => {
            
        });
        if (completed) {
            list.appendChild(completed.render());
        }

        return list;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return TodoList.HTML_CLS;
    }
}
