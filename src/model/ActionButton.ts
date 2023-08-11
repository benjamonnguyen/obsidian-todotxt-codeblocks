import ViewModel from "./ViewModel";

export class ActionButton implements ViewModel {
    static HTML_CLASS = "todotxt-action-btn"

    type: ActionType;
    id: string;
    itemId: string;

    constructor(type: ActionType, id: string, itemId: string) {
        this.type = type;
        this.id = id;
        this.itemId = itemId;
    }
    render(): HTMLElement {
        const svg = document.createElement("svg");
        svg.addClass(this.getHtmlCls());
        svg.setAttrs({
            "xmlns": "http://www.w3.org/2000/svg",
            "viewBox": "0 0 100 100",
            "stroke": "currentColor",
            "action": this.type.name,
            "id": this.id,
            "item-id": this.itemId,
        });
        svg.appendChild(this.type.path);

        return svg;
    }
    getId(): string | undefined {
        throw new Error("Method not implemented.");
    }
    getHtmlCls(): string {
        return ActionButton.HTML_CLASS;
    }
}

export class ActionType {
    
    static EDIT = new ActionType("edit", {
        "strokeLinecap": "round",
        "strokeLinejoin": "round",
        "d": "M61.5,25.9,74,38.5M66.8,20.6A8.9,8.9,0,0,1,79.3,33.2L30.5,82H18.1V69.3Z"
    });

    static DEL = new ActionType("delete", {
        "strokeLinecap": "round",
        "strokeLinejoin": "round",
        "d": "M78.1,29.9,74.6,78.7a8,8,0,0,1-8,7.4H33.4a8,8,0,0,1-8-7.4L21.9,29.9M42,46V70.1M58,46V70.1m4-40.2v-12a4,4,0,0,0-4-4H42a4,4,0,0,0-4,4v12m-20.1,0H82.1"
    });

    static ADD = new ActionType("add", {
        "strokeLinecap": "round",
        "strokeLinejoin": "round",
        "d": "M50,18.8V50m0,0V81.2M50,50H81.2M50,50H18.8"
    });

    path: HTMLElement;
    name: string;
    
    constructor(name: string, pathAttrs: { [key: string]: string | number | boolean | null; }) {
        this.name = name;
        this.path = document.createElement("path");
        this.path.setAttrs(pathAttrs);
    }
}
