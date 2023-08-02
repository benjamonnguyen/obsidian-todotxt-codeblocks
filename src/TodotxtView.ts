import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { Line } from '@codemirror/state';
import type { PluginValue } from '@codemirror/view';
import { TodoItem } from "./TodoItem";
import { MarkdownView, Notice } from 'obsidian';
import { UNSAVED_TODO_ITEM_IDS } from './todotxtBlockProcessor';

export const BLOCK_OPEN = "\`\`\`todotxt";
export const BLOCK_CLOSE = "\`\`\`";

class TodotxtView implements PluginValue {
    private readonly view: EditorView;

    constructor(view: EditorView) {
        this.view = view;
    }

    update(update: ViewUpdate) {
	}
    
	destroy() {
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

        const line = this.getTodoItemLine(span.id, view);
        const todoItem = new TodoItem(line.text);
		todoItem.setComplete(!todoItem.complete());

		event.preventDefault();
        this.updateView(view, [{from: line.from, to: line.to, insert: todoItem.toString()}]);

        return true;
    }

    save(mdView: MarkdownView) {
        if (!UNSAVED_TODO_ITEM_IDS.length) return;
        // State changes do not persist to EditorView in Reading mode.
        if (mdView.getMode() === "preview") return;
        // @ts-ignore
        const view = mdView.editor.cm as EditorView;

        const ids = [...UNSAVED_TODO_ITEM_IDS];
        UNSAVED_TODO_ITEM_IDS.length = 0; // TODO race condition?
        const changes: {from: number, to: number, insert: string}[] = [];
        ids.forEach(id => {
            const line = this.getTodoItemLine(id, view);
            const todoItem = new TodoItem(line.text);
            changes.push({from: line.from, to: line.to, insert: todoItem.toString()});
        });
        this.updateView(view, changes);
        var noticeMsg = "obsidian-inline-todotxt: Saved todos\n";
        changes.forEach(c => noticeMsg += `- ${c.insert}\n`);
        new Notice(noticeMsg);
    }

    private getTodoItemLine(id: string, view: EditorView): Line {
        const el = document.getElementById(id)!;
        const pos = view.posAtDOM(el);
		const startLine = view.state.doc.lineAt(pos);
		// console.log("pos", pos, "- line", startLine);
		/* Workaround since view.posAtDOM(codeBlockLine) returns the position
		 * of the start of the code block.
		*/
		const itemIdx = parseInt(id.match(/\d+$/)?.first()!);
		
        return view.state.doc.line(startLine.number + 1 + itemIdx);
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

	private updateView(view: EditorView, changes: {from: number, to: number, insert: string}[]) {
		const transaction = view.state.update({changes: changes});
		view.dispatch(transaction);
	}
}

export const todotxtView = ViewPlugin.fromClass(TodotxtView);