import { EditorView, ViewPlugin, ViewUpdate, DecorationSet, PluginSpec, WidgetType } from '@codemirror/view';
import type { PluginValue } from '@codemirror/view';
import { TodoItem } from "./TodoItem";

const BLOCK_OPEN = "\`\`\`todotxt";
const BLOCK_CLOSE = "\`\`\`";

class TodotxtView implements PluginValue {
    private readonly view: EditorView;

    constructor(view: EditorView) {
        this.view = view;

        this.handleTodoItemToggle = this.handleTodoItemToggle.bind(this);
        this.view.dom.addEventListener('click', this.handleTodoItemToggle);
		// this.handleTodoItemKeyPress = this.handleTodoItemKeyPress.bind(this);
		// this.view.dom.addEventListener('keypress', this.handleTodoItemKeyPress);
		// TODO ('paste', ClipboardEvent)
		
		// TODO periodic persistence of todoItemsInVisibleRange
    }

    update(update: ViewUpdate) {
	}
    
	destroy() {
		this.view.dom.removeEventListener('click', this.handleTodoItemToggle);
		// this.view.dom.removeEventListener('keypress', this.handleTodoItemKeyPress);
	}

    private handleTodoItemToggle(event: MouseEvent): boolean {
        const { target } = event;

		if (!target || !(target instanceof HTMLInputElement) || target.type !== "checkbox") {
            return false;
        }
		const span = target.parentElement;
        if (!span || !(span instanceof HTMLSpanElement) || span.className !== "todotxt-md-item") {
			return false;
		}

		/* Due to an API limitation, this.view.posAtDOM(span) returns the pos
		 * of the start of the code block.
		*/
        const pos = this.view.posAtDOM(span);
		const startLine = this.view.state.doc.lineAt(pos).number;
		
		// Find and update todoItem.
		const itemIdx = parseInt(span.id.match(/\d+$/)?.first()!);
		const line = this.view.state.doc.line(startLine + 1 + itemIdx);
        const todoItem = new TodoItem(line.text);
		todoItem.setComplete(!todoItem.complete());

		event.preventDefault();

		this.updateView({from: line.from, to: line.to, insert: todoItem.toString()});

        // Dirty workaround.
        // While the code in this method properly updates the `checked` state
        // of the target checkbox, some Obsidian internals revert the state.
        // This means that the checkbox would remain in its original `checked`
        // state (`true` or `false`), even though the underlying document
        // updates correctly.
        // As a "fix", we set the checkbox's `checked` state *again* after a
        // timeout to revert Obsidian's wrongful reversal.
        // const desiredCheckedStatus = target.checked;
        // setTimeout(() => {
        //     target.checked = desiredCheckedStatus;
        // }, 1);

        return true;
    }

	// private handleTodoItemKeyPress(event: KeyboardEvent) {
	// 	const { target } = event;

    //     // Only handle TodoItem lines.
    //     if (!target || !(target instanceof HTMLElement)) {
    //         return false;
    //     }
	// 	const todoItemElement = target.doc.getElementsByClassName("cm-active").item(0);
	// 	if (!todoItemElement) {
	// 		return false;
	// 	}
    //     const position = this.view.posAtDOM(todoItemElement);
	// 	if (!this.inBlock(position)) {
	// 		return false;
	// 	}
    //     const line = this.view.state.doc.lineAt(position);
    //     console.log(`Keypress - Position: ${position} Line: ${line.text}`);

    //     const todoItem = new TodoItem(line.text);
	// 	this.updateView({from: line.from, to: line.to, insert: todoItem.toString()});
	// }

    // private getTodoItemsInVisibleRangeWithPositions(): {from: number, to: number, item: TodoItem}[] {
    //   const res: {from: number, to: number, item: TodoItem}[] = [];
    
    //   var inBlock = false;
    //   for (const { from, to } of this.view.visibleRanges) {
    //     var currIdx = this.view.state.doc.lineAt(from).number;
    //     const endIdx = this.view.state.doc.lineAt(to).number;
    //     while (currIdx <= endIdx) {
    //       const currLine = this.view.state.doc.line(currIdx++);
    //       if (inBlock) {
    //         if (currLine.text.startsWith(BLOCK_CLOSE)) {
    //           inBlock = false;
    //         } else {
    //           if (currLine.text.trim().length === 0) {
    //             continue;
    //           }
    //           res.push({from: currLine.from, to: currLine.to, item: new TodoItem(currLine.text)});
    //         }
    //       } else {
    //         if (currLine.text.startsWith(BLOCK_OPEN)) {
    //           inBlock = true;
    //         }
    //       }
    //     }
    //   }

    //   return res;
    // }

	private updateView(spec: {from: number, to: number, insert: string}) {
		const transaction = this.view.state.update({changes: [spec]});
		this.view.dispatch(transaction);
	}
}

export const todotxtView = ViewPlugin.fromClass(TodotxtView);