import { Item } from "jstodotxt";
import { randomUUID } from "crypto";

export class TodoItem extends Item {
    uuid = randomUUID();
    constructor(line: string) {
        super(line);
        if(!this.created()) {
            this.setCreated(new Date());
        }
    }
}