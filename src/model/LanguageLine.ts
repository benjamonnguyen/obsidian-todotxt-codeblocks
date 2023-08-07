import { randomUUID } from "crypto";
import { moment } from "obsidian";
import type { ViewModel } from ".";

export default class LanguageLine implements ViewModel {
    private static REGEX = /^```todotxt (?="([^"]+)"|((?!sort:|filter:|tog:)\S+))/;
    static HTML_CLS = "todotxt-list-title";
    static SORT_PREFIX = "sort:";
    static COLLAPSE_PREFIX = "collapse:";
    static SORT_FIELDS = new Set(["proj", "status"]);

    private id: string;
    title: string;
    collapsedProjectGroups: Set<string> = new Set();
    sortFieldToOrder: Map<string, string[]> = new Map();
    filterKVs: string[] = [];

    private constructor() {}

    static from(line: string): { langLine: LanguageLine, errs: Error[] } {
        const langLine = new LanguageLine();
        const errs: Error[] = [];

        const match = LanguageLine.REGEX.exec(line);
        langLine.title = match?.at(1) || match?.at(2)
            || `Todo.txt (${moment().format("YYYY-MM-DD")})`;
        langLine.id = randomUUID();

        for (const [i, str] of line.split(" ").entries()) {
            if (str.startsWith(LanguageLine.COLLAPSE_PREFIX)) {
                str.substring(LanguageLine.COLLAPSE_PREFIX.length).split(",")
                    .forEach(proj => langLine.collapsedProjectGroups.add(proj));
            } else if (str.startsWith(LanguageLine.SORT_PREFIX)) {
                // Sort ascending by default.
                const res = LanguageLine.handleSort(str);
                if (res instanceof Error) {
                    errs.push(res);
                } else {
                    langLine.sortFieldToOrder.set(res.field, res.order);
                }
            } else if (str.startsWith("filter:")) {
                // this.filterKVs.push(...str.substring(7).split(","));
            }
        }

        return { langLine, errs };
    }

    render(): HTMLElement {
        const title = document.createElement("h2");
        title.id = this.id;
        title.addClass(this.getHtmlCls());
        title.setText(this.title);

        return title;
    }

    toString() {
        let line = `\`\`\`todotxt "${this.title}"`;
        for (const [field, order] of this.sortFieldToOrder.entries()) {
            line += " " + LanguageLine.SORT_PREFIX + field;
            if (order.length) {
                line += ":" + order.join(",");
            }
        }
        if (this.collapsedProjectGroups.size) {
            line += " " + LanguageLine.COLLAPSE_PREFIX + Array.from(this.collapsedProjectGroups).join(",");
        }

        return line;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return LanguageLine.HTML_CLS;
    }

    private static handleSort(str: string): { field: string, order: string[] } | Error {
        const segs = str.split(":");
        let err;
        if (segs.length < 2) {
            return new SyntaxError(`"${str}" does not follow syntax "sort:<field>:<order?>"`);
        }
        const field = segs.at(1)!;
        const order = segs.at(2)?.split(",");
        if (!LanguageLine.SORT_FIELDS.has(field)) {
            return new SyntaxError(`"${field}" is not a valid field (${Array.from(LanguageLine.SORT_FIELDS).join(", ")})`);
        }
        if (field === "proj") {
            if (!order) {
                return new SyntaxError("Provide project order (ex. \"sort:proj:work,home,gym\")");
            }
        } else if (field === "status") {
            const orderStr = segs.at(2);
            if (orderStr && orderStr !== "asc" && orderStr !== "desc") {
                return new SyntaxError(`${field} order must be "asc" or "desc" (defaults to "asc")`);
            }
        }

        return { field, order: order?.filter(o => o.length) || [] };
    }
}
