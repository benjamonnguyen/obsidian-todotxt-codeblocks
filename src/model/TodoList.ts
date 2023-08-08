import { TodoItem, ProjectGroupContainer } from ".";
import { randomUUID } from "crypto";
import { LanguageLine } from ".";
import type { ViewModel } from ".";

export default class TodoList implements ViewModel {
    static HTML_CLS = "todotxt-list";
    // TODO static DEFAULT_SORT;

    private id: string;
    langLine: LanguageLine;
    items: TodoItem[];
    projectOrder: string[];

    constructor(langLine: LanguageLine, body: string) {
        this.id = `${randomUUID()}`;
        this.langLine = langLine;
        this.items = this.parseTodoItems(body);
        this.projectOrder = this.getProjectOrder(this.items, this.langLine.sortFieldToOrder.get("proj"));
        this.sort(this.items, this.langLine.sortFieldToOrder, this.projectOrder);
    }

    render(): HTMLElement {
        const list = document.createElement("div");
        list.addClass(this.getHtmlCls());
        list.id = this.id;

        list.appendChild(this.langLine.render());

        const ungrouped: TodoItem[] = [];
        const nameToProjectGroup: Map<string, ProjectGroupContainer> = new Map();
        this.projectOrder.forEach(proj => nameToProjectGroup.set(proj,
            new ProjectGroupContainer(proj, [], this.langLine.collapsedProjectGroups.has(proj))));
        this.items.forEach(item => {
            if (!item.projects().length) {
                ungrouped.push(item);
            } else {
                item.projects().forEach(proj => {
                    nameToProjectGroup.get(proj)?.items.push(item);
                });
            }
        });

        list.innerHTML += ungrouped
            .map(item => item.render().outerHTML)
            .join("<br>");

        this.projectOrder.forEach(proj => {
            const projectGroup = nameToProjectGroup.get(proj)!;
            list.appendChild(projectGroup.render());
        });

        return list;
    }

    getId(): string {
        return this.id;
    }

    getHtmlCls(): string {
        return TodoList.HTML_CLS;
    }

    private parseTodoItems(body: string): TodoItem[] {
        return body.split("\n").filter(line => line.trim().length)
            .map(line => new TodoItem(line));
    }

    private sort(items: TodoItem[], sortFieldToOrder: Map<string, string[]>, projectOrder: string[]) {
        if (!items || !projectOrder) throw "Invalid args!";
        const ASC = "asc";

        // dates (creation, completion)

        // ctx

        // prio
        const prioritySortOrder = sortFieldToOrder.get("prio");
        if (prioritySortOrder) {
            items.sort((a, b) => {
                const aScore = a.priority()?.charCodeAt(0) || Number.MAX_VALUE;
                const bScore = b.priority()?.charCodeAt(0) || Number.MAX_VALUE;
                if (!prioritySortOrder.length || prioritySortOrder.first()! === ASC) {
                    return aScore - bScore;
                }
                return bScore - aScore;
            });
        }

        // due

        // status
        const statusSortOrder = sortFieldToOrder.get("status");
        if (statusSortOrder) {
            items.sort((a, b) => {
                const aScore = a.complete() ? 1 : 0;
                const bScore = b.complete() ? 1 : 0;
                if (!statusSortOrder.length || statusSortOrder.first()! === ASC) {
                    return aScore - bScore;
                }
                return bScore - aScore;
            });
        }

        // project
        items.sort((a, b) => {
            let aScore = a.projects().length ? Number.MAX_VALUE : -1;
            let bScore = b.projects().length ? Number.MAX_VALUE : -1;

            a.projects().forEach(proj => aScore = Math.min(projectOrder.indexOf(proj), aScore));
            b.projects().forEach(proj => bScore = Math.min(projectOrder.indexOf(proj), bScore));

            return aScore - bScore;
        });

        for (const [i, item] of this.items.entries()) {
            item.setIdx(i);
        }
    }

    private getProjectOrder(items: TodoItem[], projSortOrder: string[] | undefined): string[] {
        if (!items) throw "Invalid args!";

        // Get existing projects
        const projects: Set<string> = new Set();
        items.forEach(item => item.projects().forEach(proj => projects.add(proj)));

        // Filter out nonexistent projects from projectOrder
        const projectOrder = projSortOrder
            ? [...projSortOrder.filter(proj => projects.has(proj))]
            : [];

        // Append projects without sort order in alphabetical order
        const remainingProjects: string[] = Array.from(projects)
            .filter(proj => !projectOrder.contains(proj))
            .sort();

        return projectOrder.concat(remainingProjects);
    }
}
