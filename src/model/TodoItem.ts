import { Item } from "jstodotxt";
import { randomUUID } from "crypto";
import { ActionButton, ActionType, type ViewModel } from ".";
import { AddModal, EditItemModal } from "src/component";
import { moment } from "obsidian";
import { processExtensions, ExtensionType } from "src/extension";


export default class TodoItem extends Item implements ViewModel {
    static HTML_CLS = "todotxt-item";
    
    private id: string | undefined;
    
    constructor(text: string, idx: number | undefined = undefined) {
        super(text);
        if (idx !== undefined) this.setIdx(idx);
    }

    setBody(body: string): void {
        super.setBody(body);
        processExtensions(this);
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
        
        item.createEl("span").outerHTML = this.buildDescriptionHtml();

        const actions = item.createSpan({
            cls: "todotxt-item-actions"
        });

        actions.appendChild(new ActionButton(ActionType.EDIT, EditItemModal.ID, item.id).render());
        actions.appendChild(new ActionButton(ActionType.DEL, AddModal.ID, item.id).render());
        
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

    addExtension(key: string, value: string): void {
        // if extension is of reserved extension type, replace
        if (Object.values(ExtensionType).includes(key as ExtensionType)) {
            const oldExt = this.extensions().find(ext => ext.key === key);
            if (oldExt) {
                this.removeExtension(oldExt.key, oldExt.value);
                console.warn(`Replacing ${oldExt.key} extension value: ${oldExt.value} -> ${value}`);
            }
        }
        super.addExtension(key, value);
        processExtensions(this);
    }

    setExtension(key: string, value: string): void {
        // there's a span tracking bug
        throw "Use addExtension() instead";
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

    private buildDescriptionHtml(): string {
        let descriptionHtml = "<span class=\"todotxt-item-description\">";
        for (const str of this.body().split(" ")) {
            if (str.startsWith(ExtensionType.DUE + ":")) {
                const split = str.split(":");
                const due = moment(split.at(1));
                const now = moment();
                const extension = split[0] + ":" + split[1];
                if (due.isSame(now, "d")) {
                    descriptionHtml += "<span class=\"todotxt-due-ext todotxt-due-today\">" + extension + "</span>";
                } else if (due.isBefore(now, "d")) {
                    descriptionHtml += "<span class=\"todotxt-due-ext todotxt-overdue\">" + extension + "</span>";
                } else {
                    descriptionHtml += "<span class=\"todotxt-due-ext todotxt-due-later\">" + extension + "</span>";
                }
                const remaining = split.slice(2);
                if (remaining.length) {
                    descriptionHtml += ":" + split.slice(2).join(":");
                }
                descriptionHtml += " ";
            } else {
                descriptionHtml += str + " ";
            }
        };
        descriptionHtml += "</span>";
        
        return descriptionHtml.trimEnd();
    }
}
