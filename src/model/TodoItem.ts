import { v4 as randomUUID } from "uuid";
import { ActionButton, ActionType, type ViewModel } from ".";
import { Item } from "./Item";
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
        
        this.buildDescriptionHtml(item);
        
        const actions = item.createSpan({
            cls: "todotxt-item-actions"
        });
        actions.append(
            new ActionButton(ActionType.EDIT, EditItemModal.ID, item.id).render(),
            new ActionButton(ActionType.DEL, AddModal.ID, item.id).render(),
        );
        
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
        if (Object.values(ExtensionType).includes(key as ExtensionType)) {
            if (this.getExtensions(key).first()) {
                console.warn(`${key} extension already exists! Skipping add: ${value}`);
                return;
            }
        }
        super.addExtension(key, value);
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

    private buildDescriptionHtml(itemEl: HTMLElement): HTMLElement {
        const span = itemEl.createSpan({
            cls: "todotxt-item-description",
        });

        for (const str of this.body().split(" ")) {
            if (this.buildDueExtensionHtml(str, span)) {
            } else {
                span.appendText(str);
            }
            span.appendText(" ");
        };

        return span;
    }

    private buildDueExtensionHtml(str: string, span: HTMLElement): boolean {
        if (str.startsWith(ExtensionType.DUE + ":")) {
            const split = str.split(":");
            if (!split.at(1)) return false;

            const due = moment(split.at(1));
            const now = moment();
            const extension = split[0] + ":" + split[1];
            if (due.isSame(now, "d")) {
                span.createSpan({
                    cls: "todotxt-due-ext todotxt-due-today",
                    text: extension,
                });
            } else if (due.isBefore(now, "d")) {
                span.createSpan({
                    cls: "todotxt-due-ext todotxt-overdue",
                    text: extension,
                });
            } else {
                span.createSpan({
                    cls: "todotxt-due-ext todotxt-due-later",
                    text: extension,
                });
            }
            
            const remaining = split.slice(2);
            if (remaining.length) {
                span.appendText(":" + split.slice(2).join(":"));
            }
        }

        return false;
    }
}
