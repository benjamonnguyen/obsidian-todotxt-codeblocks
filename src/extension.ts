import { moment, Notice } from "obsidian";
import { Moment } from "moment";
import MyPlugin from "src/main";
import { TodoItem } from "./model";

export class Extension {
    static DUE = "due";
    static RECURRING = "rec";

    static isReserved(extension: string): boolean {
        const reserved = new Set([Extension.DUE, Extension.RECURRING]);
        return reserved.has(extension);
    }
}

export function processExtensions(item: TodoItem) {

    processDueExtension(item);
}

function processDueExtension(item: TodoItem) {
    const extensions = item.extensions().filter(ext => ext.key === Extension.DUE);
    for (let i = 1; i < extensions.length; i++) {
        const { key, value } = extensions[i];
        item.removeExtension(key, value)
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
            item.setExtension(first.key, dueDate);
            let msg = "Due date set to " + dueDate;
            if (dateCalculationDetails.length) {
                msg += `\n(${dateCalculationDetails.join(", ")})`;
            }
            new Notice(MyPlugin.NAME + " INFO\n" + msg, 15000);
        } else {
            const errMsg = "Invalid value for due extension: " + first.value;
            console.warn(errMsg);
            item.removeExtension(first.key, first.value);
            new Notice(MyPlugin.NAME + " WARNING\n" + errMsg, 15000);
        }
    }
}
