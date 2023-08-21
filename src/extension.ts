import { moment, Notice } from "obsidian";
import { Moment } from "moment";
import TodotxtCodeblocksPlugin from "src/main";
import { TodoItem } from "./model";

export enum ExtensionType {
    DUE = "due",
    RECURRING = "rec",
}

export function processExtensions(item: TodoItem) {

    processDueExtensions(item);
    processRecurringExtensions(item);
}

function processDueExtensions(item: TodoItem) {
    const ext = reduceExtensions(item, ExtensionType.DUE);
    if (ext) {
        try {
            const { date, details } = calculateDate(ext.value);
            if (date === ext.value) return;
            console.log(item.extensions());
            item.addExtension(ExtensionType.DUE, date);
            console.log(item.extensions());
            let msg = "Due date set to " + date;
            if (details) {
                msg += `\n(${details})`;
            }
            new Notice(TodotxtCodeblocksPlugin.NAME + " INFO\n" + msg, 15000);
        } catch (_) {
            handleError(item, ext);
        }
    }
}

function processRecurringExtensions(item: TodoItem) {
    const ext = reduceExtensions(item, ExtensionType.RECURRING);
    if (ext) {
        try {
            calculateDate(ext.value);
        } catch (_) {
            handleError(item, ext);
        }
    }
}

// remove duplicates of given type and return first extension
function reduceExtensions(item: TodoItem, extType: ExtensionType): { key: string, value: string } | undefined {
    const extensions = item.extensions().filter(ext => ext.key === extType);
    for (let i = 1; i < extensions.length; i++) {
        const { key, value } = extensions[i];
        item.removeExtension(key, value)
        console.warn(`Removed duplicate key/value pair for reserved extension: ${key}/${value}`);
    }

    return extensions.first();
}

function calculateDate(value: string): { date: string, details: string | undefined } {
    // <YYYY-MM-DD> (ex. 1996-08-06)
    let date: Moment = moment(value, "YYYY-MM-DD", true);
    if (date.isValid()) return { date: date.format("YYYY-MM-DD"), details: undefined };
    // <MM-DD> (ex. 08-06)
    date = moment(value, "MM-DD", true);
    if (date.isValid()) return { date: date.format("YYYY-MM-DD"), details: undefined };

    const dateCalculationDetails: string[] = [];
    // <number><[dateUnit]> (ex. 1d)
    // dateUnits: d, w, m, y
    // if only number is provided, unit is days (ex. 0 = today)
    const d = /^\d+$/.exec(value)?.first() || /(\d+)d/.exec(value)?.at(1);
    const w = /(\d+)w/.exec(value)?.at(1);
    const m = /(\d+)m/.exec(value)?.at(1);
    const y = /(\d+)y/.exec(value)?.at(1);
    // <dayOfWeek>
    // M, Tu, W, Th, F, Sa, Su
    // dayOfWeek must be at the very beginning or end
    const dayOfWeek = /(^(?:M|Tu|W|Th|F|Sa|Su)|(?:M|Tu|W|Th|F|Sa|Su)$)/.exec(value)?.at(1);
    // can be combined
    // 1w2d = 9 days (1 week + 2 days)
    // 2mM = first Monday in 2 months
    // M2m = first Monday in 2 months
    if (d || w || m || y || dayOfWeek) {
        date = moment()
            .add(d, "d")
            .add(w, "w")
            .add(m, "M")
            .add(y, "y");
        
        if (dayOfWeek) {
            const day = date.day(["Su", "M", "Tu", "W", "Th", "F", "Sa"].indexOf(dayOfWeek));
            if (moment().isSameOrAfter(day)) day.add(7, "d");
            dateCalculationDetails.push("dayOfWeek: " + dayOfWeek);
        }
        if (d) dateCalculationDetails.push("d: " + d);
        if (w) dateCalculationDetails.push("w: " + w);
        if (m) dateCalculationDetails.push("m: " + m);
        if (y) dateCalculationDetails.push("y: " + y);

        return { date: date.format("YYYY-MM-DD"), details: dateCalculationDetails.join(", ") };
    }

    throw "Invalid value: " + value;
}

function handleError(item: TodoItem, extension: { key: string, value: string }) {
    const errMsg = `Invalid value for \"${extension.key}\" extension: ${extension.value}`;
    console.warn(errMsg);
    item.removeExtension(extension.key, extension.value);
    new Notice(TodotxtCodeblocksPlugin.NAME + " WARNING\n" + errMsg, 15000);
}
