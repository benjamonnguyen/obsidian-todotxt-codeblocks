import { TodoItem } from ".";

export class ProjectGroup implements ViewModel {

    items: TodoItem[];

    render(): HTMLElement {
        throw new Error("Method not implemented.");
    }
    toString(): string {
        throw new Error("Method not implemented.");
    }
    getId(): string {
        throw new Error("Method not implemented.");
    }
    getHtmlCls(): string {
        throw new Error("Method not implemented.");
    }
}
