import { Item } from "jstodotxt";

export class TodoItem extends Item {
    constructor(line: string) {
        super(line);
        if(!this.created()) {
            this.setCreated(new Date());
        }
    }
}