import { Item } from "jstodotxt";
import { randomUUID } from "crypto";
import { ActionButton, ActionType, type ViewModel } from ".";
import { AddModal, EditItemModal } from "src/component";
import { moment, Notice } from "obsidian";
import { Moment } from "moment";
import MyPlugin from "src/main";


export default class TodoItem extends Item implements ViewModel {
    static HTML_CLS = "todotxt-item";
    
    private id: string | undefined;
    
    constructor(text: string, idx: number | undefined = undefined) {
        super(text);
        if (idx !== undefined) this.setIdx(idx);
    }

    setBody(body: string): void {
        super.setBody(body);
        this.processExtensions();
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
        
        let descriptionHtml = "<span class=\"todotxt-item-description\">";
        for (const str of this.body().split(" ")) {
            if (str.startsWith(Extension.DUE + ":")) {
                const split = str.split(":");
                const due = moment(split.at(1));
                const now = moment();
                const extension = split[0] + ":" + split[1];
                if (due.isSame(now, "d")) {
                    descriptionHtml += "<span class=\"todotxt-due-today\">" + extension + "</span>";
                } else if (due.isBefore(now, "d")) {
                    descriptionHtml += "<span class=\"todotxt-overdue\">" + extension + "</span>";
                } else {
                    descriptionHtml += "<span class=\"todotxt-due\">" + extension + "</span>";
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
        const description = item.createSpan();
        description.outerHTML = descriptionHtml.trimEnd();

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

    // #region extensions
    addExtension(key: string, value: string): void {
        if (Extension.isReserved(key) && this.extensions().find(ext => ext.key === key)) {
            throw "Extension already exists for key: " + key;
        }
        super.addExtension(key, value);
        this.processExtensions();
    }

    private processExtensions() {

        this.processDueExtension();
    }

    private processDueExtension() {
        const extensions = this.extensions().filter(ext => ext.key === Extension.DUE);
        for (let i = 1; i < extensions.length; i++) {
            const { key, value } = extensions[i];
            this.removeExtension(key, value)
            console.warn(`Removed duplicate key/value pair for reserved extension: ${key}/${value}`);
        }
        const first = extensions.first();
        // <YYYY-MM-DD> (ex. 1996-08-06)
        let res: Moment = moment(first?.value, "YYYY-MM-DD", true);
        if (first && !res.isValid()) {
            if (!res.isValid()) {
                // <MM-DD> (ex. 08-06)
                res = moment(first.value, "MM-DD", true);
            }
            const dateCalculationDetails: string[] = [];
            if (!res.isValid()) {
                // <number><[dateUnit]> (ex. 1d)
                // dateUnits: d, w, m, y
                // if only number is provided, unit is days (ex. 0 = today)
                const d = /^\d+$/.exec(first.value)?.first() || /(\d+)d/.exec(first.value)?.at(1);
                const w = /(\d+)w/.exec(first.value)?.at(1);
                const m = /(\d+)m/.exec(first.value)?.at(1);
                const y = /(\d+)y/.exec(first.value)?.at(1);
                // <dayOfWeek>
                // M, Tu, W, Th, F, Sa, Su
                // dayOfWeek must be at the very beginning or end
                const dayOfWeek = /(^(?:M|Tu|W|Th|F|Sa|Su)|(?:M|Tu|W|Th|F|Sa|Su)$)/.exec(first.value)?.at(1);

                // can be combined
                // 1w2d = 9 days (1 week + 2 days)
                // 2mM = first Monday in 2 months
                // M2m = first Monday in 2 months
                if (d || w || m || y || dayOfWeek) {
                    res = moment()
                        .add(d, "d")
                        .add(w, "w")
                        .add(m, "M")
                        .add(y, "y");

                    if (dayOfWeek){
                        if (!res.isValid()) res = moment();
                        res.day(["Su", "M", "Tu", "W", "Th", "F", "Sa"].indexOf(dayOfWeek) + 7);
                        dateCalculationDetails.push("dayOfWeek: " + dayOfWeek);
                    }
                    if (d) dateCalculationDetails.push("d: " + d);
                    if (w) dateCalculationDetails.push("w: " + w);
                    if (m) dateCalculationDetails.push("m: " + m);
                    if (y) dateCalculationDetails.push("y: " + y);
                }
            }

            if (res.isValid()) {
                const dueDate = res.format("YYYY-MM-DD");
                this.setExtension(first.key, dueDate);
                let msg = "Due date set to " + dueDate;
                if (dateCalculationDetails.length) {
                    msg += `\n(${dateCalculationDetails.join(", ")})`;
                }
                new Notice(MyPlugin.NAME + " INFO\n" + msg, 15000);
            } else {
                const errMsg = "Invalid value for due extension: " + first.value;
                console.warn(errMsg);
                this.removeExtension(first.key, first.value);
                new Notice(MyPlugin.NAME + " WARNING\n" + errMsg, 15000);
            }
        }
    }
    // #endregion
    
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

class Extension {
    static DUE = "due";
    static RECURRING = "rec";

    static isReserved(extension: string): boolean {
        const reserved = new Set([Extension.DUE, Extension.RECURRING]);
        return reserved.has(extension);
    }
}