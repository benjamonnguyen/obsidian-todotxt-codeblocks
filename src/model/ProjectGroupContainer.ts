import { randomUUID } from "crypto";
import { TodoItem } from ".";

export class ProjectGroupContainer implements ViewModel {

    static HTML_CLS = "project-group-container";
    static LIST_CLS = "project-group-list";
    static CHECKBOX_CLS = "project-group-checkbox";

    private id: string;
    items: TodoItem[];
    name: string;
    isToggled: boolean;

    constructor(name: string, items: TodoItem[], isToggled: boolean) {
        this.name = name;
        this.items = items;
        this.isToggled = isToggled;
    }

    render(): HTMLElement {
        const container = document.createElement("div");
        container.addClass(this.getHtmlCls());

        const checkboxId = randomUUID();
        const checkbox = container.createEl("input", {
            type: "checkbox",
            cls: ProjectGroupContainer.CHECKBOX_CLS,
        });
        checkbox.id = checkboxId;
        checkbox.setAttr(this.isToggled ? "checked" : "unchecked", true);
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
