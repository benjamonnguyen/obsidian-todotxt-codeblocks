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
        
        const item = document.createElement("div");
        item.addClass(this.getHtmlCls());
        item.id = this.id;
        
        const checkbox = item.createEl("input", {
            type: "checkbox",
            cls: "task-list-item-checkbox",
        });
        checkbox.setAttr(this.complete() ? "checked" : "unchecked", true);
        
        if (this.priority()) {
            item.createEl("span", {
                cls: this.getPriorityHtmlClasses(),
                text: this.priority()!,
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

    setExtension(key: string, value: string): void {
        super.setExtension(key, value);
        processExtensions(this);
    }

    addExtension(key: string, value: string): void {
        if (Object.values(ExtensionType).includes(key as ExtensionType)) {
            if (this.getExtensions(key).first()) {
                console.warn(`${key} extension already exists! Skipping add: ${value}`);
                return;
            }
        }
        super.addExtension(key, value);
        processExtensions(this);
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
        const description = itemEl.createSpan({
            cls: "todotxt-item-description",
        });

        // Word or Markdown link
        const REGEX = /\[[^\[\]\(\)\n]*\]\([^\[\]\(\)\n]*\)|\S+/g
        const bodyItr = this.body().matchAll(REGEX);
        let next = bodyItr.next();
        while (!next.done) {
            const span = this.buildDueExtensionHtml(next.value[0]) || this.buildLink(next.value[0]);
            if (span) {
                description.appendChild(span);
            } else {
                description.appendText(next.value[0]);
            }
            description.appendText(" ");
            next = bodyItr.next();
        }

        return description;
    }

    private buildDueExtensionHtml(str: string): HTMLSpanElement | undefined {
        if (str.startsWith(ExtensionType.DUE + ":")) {
            const split = str.split(":", 2);
            if (!split.at(1)) return;

            const span = document.createElement("span");
            span.setText(str);
            span.addClass("todotxt-due-ext")
            const due = moment(split.at(1));
            const now = moment();
            if (due.isSame(now, "d")) {
                span.addClass("todotxt-due-today");
            } else if (due.isBefore(now, "d")) {
                span.addClass("todotxt-overdue");
            } else if (due.diff(now, "d") <= 7) {
                span.addClass("todotxt-due-week");
            } else if (due.diff(now, "d") <= 30) {
                span.addClass("todotxt-due-month");
            } else {
                span.addClass("todotxt-due-later");
            }

            return span
        }
    }

    private buildLink(str: string): HTMLSpanElement | undefined {
        const REGEX = /\[([^\[\]\(\)\n]*)\]\(([^\[\]\(\)\n]*)\)/;
        const match = str.match(REGEX);
        if (match) {
            const span = document.createElement("span");
            span.addClass("cm-url", "todotxt-link");
            span.setText(match.at(1) || "[]");
            const link = match.at(2) || "()";
            span.setAttr("link", link);

            if (!link.startsWith("obsidian://")) {
                try {
                    new URL(link);
                    span.createSpan({
                        cls: "cm-url external-link todotxt-link",
                        attr: {link},
                    });
                } catch (_) {}
            }
            
            return span;
        }
    }
}
