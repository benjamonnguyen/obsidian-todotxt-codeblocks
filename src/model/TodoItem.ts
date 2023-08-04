import { Item } from "jstodotxt";
import { randomUUID } from "crypto";


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
