import { v4 as randomUUID } from "uuid";
import { TodoItem } from ".";
import type { ViewModel } from ".";

export default class ProjectGroupContainer implements ViewModel {

    static HTML_CLS = "project-group-container";
    static LIST_CLS = "project-group-list";
    static CHECKBOX_CLS = "project-group-checkbox";

    private id: string;
    items: TodoItem[];
    name: string;
    isCollapsed: boolean;
    isCompleted: boolean;

    constructor(name: string, items: TodoItem[], isCollapsed: boolean) {
        this.name = name;
        this.items = items;
        this.isCollapsed = isCollapsed;
        this.isCompleted = this.items.every((item => item.complete()));
    }

    render(): HTMLElement {
        const container = document.createElement("div");
        container.addClass(this.getHtmlCls());
        if (this.isCompleted) {
            container.setAttr("completed", true);
        }

        const checkboxId = randomUUID();
        const checkbox = container.createEl("input", {
            type: "checkbox",
            cls: ProjectGroupContainer.CHECKBOX_CLS,
        });
        checkbox.id = checkboxId;
        checkbox.setAttr(!this.isCollapsed ? "checked" : "unchecked", true);
        container.createEl("label", {
            attr: {"for": checkboxId},
        }).setText("+" + this.name);

        const list = container.createDiv({
            cls: ProjectGroupContainer.LIST_CLS,
        });
        this.items.forEach(item => list.appendChild(item.render()));

        return container;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return ProjectGroupContainer.HTML_CLS;
    }
}
