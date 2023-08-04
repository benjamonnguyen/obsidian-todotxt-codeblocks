import { randomUUID } from "crypto";
import { TodoItem } from ".";

export class ProjectGroupContainer implements ViewModel {

    static HTML_CLS = "project-group-container";

    private id: string;
    items: TodoItem[];
    name: string;

    constructor(name: string, items: TodoItem[]) {
        this.name = name;
        this.items = items;
    }

    render(): HTMLElement {
        const container = document.createElement("div");
        container.addClass(this.getHtmlCls());

        const checkboxId = randomUUID();
        container.createEl("input", {
            type: "checkbox",
            cls: "project-group-checkbox",
        }).id = checkboxId;
        container.createEl("label", {
            attr: {"for": checkboxId},
        }).setText("+" + this.name);

        container.createDiv({
            cls: "project-group-list",
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
