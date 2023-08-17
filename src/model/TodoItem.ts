import { Item } from "jstodotxt";
import { randomUUID } from "crypto";
import { ActionButton, ActionType, type ViewModel } from ".";
import { AddModal, EditItemModal } from "src/component";
import { moment } from "obsidian";
import { Moment } from "moment";


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
        
        const description = item.createSpan({
            cls: "todotxt-item-description",
            text: this.body(),
        });
        const actions = item.createSpan({
            cls: "todotxt-item-actions"
        });

        actions.appendChild(new ActionButton(ActionType.EDIT, EditItemModal.ID, item.id).render());
        actions.appendChild(new ActionButton(ActionType.DEL, AddModal.ID, item.id).render());
        
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

    // #region extensions
    getExtensionsAsMap(): Map<string, string> {
        const res: Map<string, string> = new Map();
        this.extensions().forEach(({ key, value }) => {
            if (res.has(key)) {
                // to adhere to todo.txt spec, allow duplicate keys in body but only use first occurence
                console.warn(`Duplicate key/value pair in extensions: ${key}/${value}`);
            } else {
                res.set(key, value);
            }
        })

        return res;
    }

    addExtension(key: string, value: string): void {
        if (Extension.isReserved(key) && this.extensions().find(ext => ext.key === key)) {
            throw "Extension already exists for key: " + key;
        }
        super.addExtension(key, value);
        this.processExtensions();
    }

    private processExtensions() {

        this.processDueExtension();
        //     - <number><[dateUnit]> (ex. 1d)
        //     - dateUnits: d, w, m, y (defaults to d)
        //     - 0 = today
        //   - <alias>
        //     - aliases: M, Tu, W, Th, F, Sa, Su
        //   - can be combined
        //     - 1w2d = 9 days (1 week + 2 days)
        //     - 2mM = first Monday in 2 months
        //   - <YYYY-MM-DD> (ex. 1996-08-06)
        //   - <MM-DD> (ex. 08-06)
    }

    private processDueExtension() {
        const extensions = this.extensions().filter(ext => ext.key === Extension.DUE);
        for (let i = 1; i < extensions.length; i++) {
            const { key, value } = extensions[i];
            this.removeExtension(key, value)
            console.warn(`Removed duplicate key/value pair for reserved extension: ${key}/${value}`);
        }
        const first = extensions.first();
        if (first) {
            let res: Moment = moment(first.value, "YYYY-MM-DD", true);
            if (res.isValid()) {
                this.setExtension(first.key, res.format("YYYY-MM-DD"));
                return;
            } 
            res = moment(first.value, "MM-DD", true);
            if (res.isValid()) {
                this.setExtension(first.key, res.format("YYYY-MM-DD"));
                return;
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