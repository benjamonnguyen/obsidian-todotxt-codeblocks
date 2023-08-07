import { Item } from "jstodotxt";
import { randomUUID } from "crypto";
import type { ViewModel } from ".";


export default class TodoItem extends Item implements ViewModel {
    static HTML_CLS = "todotxt-item";

    private id: string | undefined;

    constructor(text: string, idx: number | undefined = undefined) {
        super(text);
        if (idx !== undefined) this.setIdx(idx);
        if (!this.created()) {
            this.setCreated(new Date());
        }
    }

    render(): HTMLElement {
        if (!this.id) throw "No id!";

        const item = document.createElement("span");
        item.addClass(this.getHtmlCls());
        item.id = this.id;

        const checkbox = item.createEl("input", {
            type: "checkbox",
            cls: "task-list-item-checkbox",
        });
        checkbox.setAttr(this.complete() ? "checked" : "unchecked", true);

        if (this.priority()) {
            item.createEl("button", {
                cls: this.getPriorityHtmlClasses(),
                text: this.priority()!,
                attr: {"disabled": true},
            });
        }

        item.createSpan({
            cls: "todotxt-item-description",
            text: this.body(),
        });

        // TODO TodoContext/TodoProject

        return item;
    }

    getId(): string | undefined {
        return this.id;
    }

    getHtmlCls(): string {
        return TodoItem.HTML_CLS;
    }

    setIdx(idx: number) {
        this.id = randomUUID() + "-" + idx;
    }

    getIdx(): number | undefined {
        if (this.id) {
            return parseInt(this.id.match(/\d+$/)?.first()!);
        }
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
