import { randomUUID } from "crypto";
import { moment } from "obsidian";
import type { ViewModel } from ".";

export default class LanguageLine implements ViewModel {
    private static REGEX = /^```todotxt (?="([^"]+)"|((?!sort:|filter:|tog:)\S+))/;
    static HTML_CLS = "todotxt-list-title";
    static SORT_PREFIX = "sort:";
    static COLLAPSE_PREFIX = "collapse:";

    private id: string;
    title: string;
    collapsedProjectGroups: Set<string> = new Set();
    sortKVs: Map<string, string[]> = new Map();
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
                const segs = str.split(":");
                if (segs.length !== 3) {
                    console.error("Invalid sort syntax: %s", str);
                    errs.push(new SyntaxError("Invalid sort syntax: " + str));
                    continue;
                }
                langLine.sortKVs.set(segs.at(1)!, segs.at(2)!.split(","));
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
        for (const [k, v] of this.sortKVs.entries()) {
            line += ` ${LanguageLine.SORT_PREFIX}${k}:${v}`;
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
}
