import { Item } from "jstodotxt";

// const CHECKBOX_REGEX = /- \[[xX\s]\] /g;

export class TodoItem extends Item {
    constructor(line: string) {
        super(line);
        if(!this.created()) {
            this.setCreated(new Date());
        }
    }
}