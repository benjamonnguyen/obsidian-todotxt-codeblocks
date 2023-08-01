import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import type { PluginValue } from '@codemirror/view';
import { TodoItem } from "./TodoItem";
import { MarkdownView, Notice } from 'obsidian';

const BLOCK_OPEN = "\`\`\`todotxt";
const BLOCK_CLOSE = "\`\`\`";

class TodotxtView implements PluginValue {
    private readonly view: EditorView;

    constructor(view: EditorView) {
        this.view = view;

        // this.handleTodoItemToggle = this.handleTodoItemToggle.bind(this);
        // this.view.dom.addEventListener('click', this.handleTodoItemToggle);
		// this.handleTodoItemKeyPress = this.handleTodoItemKeyPress.bind(this);
		// this.view.dom.addEventListener('keypress', this.handleTodoItemKeyPress);
		// TODO ('paste', ClipboardEvent)
		
		// TODO periodic persistence of todoItemsInVisibleRange
    }

    update(update: ViewUpdate) {
	}
    
	destroy() {
		// this.view.dom.removeEventListener('click', this.handleTodoItemToggle);
		// this.view.dom.removeEventListener('keypress', this.handleTodoItemKeyPress);
	}

    handleCheckboxToggle(event: MouseEvent, mdView: MarkdownView): boolean {
        const { target } = event;

		if (!target || !(target instanceof HTMLInputElement) || target.type !== "checkbox") {
            return false;
        }
		const span = target.parentElement;
        if (!span || !(span instanceof HTMLSpanElement) || span.className !== "todotxt-md-item") {
			return false;
		}
        /* State changes do not persist to EditorView in Reading mode.
         * Create a notice and return true.
        */
        if (mdView.getMode() === "preview") {
            new Notice("obsidian-inline-todotxt warning:\nCheckbox does not work in Reading View");
            event.preventDefault();
            return true;
        }

        // @ts-ignore
        const view = mdView.editor.cm as EditorView;

        const el = document.getElementById(span.id)!;  // TODO make unique;
        const pos = view.posAtDOM(el);
		const startLine = view.state.doc.lineAt(pos);
		// console.log("pos", pos, "- line", startLine);
		/* Workaround since view.posAtDOM(codeBlockLine) returns the position
		 * of the start of the code block.
		*/
		const itemIdx = parseInt(span.id.match(/\d+$/)?.first()!);
		const line = view.state.doc.line(startLine.number + 1 + itemIdx);
        const todoItem = new TodoItem(line.text);
		todoItem.setComplete(!todoItem.complete());

		event.preventDefault();
        this.updateView(view, {from: line.from, to: line.to, insert: todoItem.toString()});

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

	private updateView(view: EditorView, spec: {from: number, to: number, insert: string}) {
		const transaction = view.state.update({changes: [spec]});
		view.dispatch(transaction);
	}
}

export const todotxtView = ViewPlugin.fromClass(TodotxtView);