import { randomUUID } from "crypto";
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

    constructor(name: string, items: TodoItem[], isToggled: boolean) {
        this.name = name;
        this.items = items;
        this.isCollapsed = isToggled;
    }

    render(): HTMLElement {
        const container = document.createElement("div");
        container.addClass(this.getHtmlCls());
        if (this.items.every((item => item.complete()))) {
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

        container.createDiv({
            cls: ProjectGroupContainer.LIST_CLS,
        }).innerHTML = this.items.map(item =>
            item.render().outerHTML).join("<br>");

        return container;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return ProjectGroupContainer.HTML_CLS;
    }
}
