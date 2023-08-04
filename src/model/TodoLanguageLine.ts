import { randomUUID } from "crypto";
import { moment } from "obsidian";

export class TodoLanguageLine implements ViewModel {
    private static REGEX = /^```todotxt (?="([^"]+)"|((?!sort:|filter:|tog:)\S+))/;
    static HTML_CLS = "todotxt-list-title";

    private id: string;
    title: string;
    toggledProjects: string[] = [];
    sortKVs: string[] = [];
    filterKVs: string[] = [];

    constructor(line: string) {
        const match = TodoLanguageLine.REGEX.exec(line);
        this.title = match?.at(1) || match?.at(2)
            || `Todo.txt (${moment().format("YYYY-MM-DD")})`;
        this.id = randomUUID();
        for (const [i, str] of line.split(" ").entries()) {
            if (str.startsWith("tog:")) {
                const projects = str.substring(4).split(",")
                    .map(s => s.toLowerCase());
                this.toggledProjects.push(...projects);
            }
        }
        // TODO handle sort/filter
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
        if (this.toggledProjects.length) {
            line += " tog:" + this.toggledProjects.join(",");
        }

        return line;
    }

    hasToggledProject(project: string) {
        return this.toggledProjects.contains(project.toLowerCase());
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return TodoLanguageLine.HTML_CLS;
    }
}
