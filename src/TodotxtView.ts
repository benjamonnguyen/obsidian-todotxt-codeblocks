import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, PluginSpec, WidgetType } from '@codemirror/view';
import { RangeSetBuilder } from "@codemirror/state";
import type { PluginValue } from '@codemirror/view';
import { TodoItem } from "./TodoItem";

const pluginSpec: PluginSpec<TodotxtView> = {
  decorations: (value: TodotxtView) => value.decorations,
};

export const todotxtView = () => {
    return ViewPlugin.fromClass(TodotxtView, pluginSpec);
}

class TodotxtView implements PluginValue {
    private readonly view: EditorView;
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.view = view;
        this.handleClickEvent = this.handleClickEvent.bind(this);
        this.view.dom.addEventListener('click', this.handleClickEvent);
		
		// this.getTodoItemsInVisibleRangeWithPositions()
		// 	.forEach(o => this.updateView({from: o.from, to: o.to, insert: o.item.toString()}));
        this.decorations = this.buildDecorations();
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations();
        }
	}
    
	destroy() {}

    private buildDecorations(): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      
      this.getTodoItemsInVisibleRangeWithPositions()
        .forEach(({from, to, item}) => builder.add(from, to, Decoration.replace({widget: new TodoItemLine(item)})));

      return builder.finish();
    }

    private handleClickEvent(event: MouseEvent): boolean {
        const { target } = event;

        // Only handle checkbox clicks.
        if (!target || !(target instanceof HTMLInputElement) || target.type !== 'checkbox' || !target.hasClass("todotxt-md-item")) {
            return false;
        }

		event.preventDefault();

        const position = this.view.posAtDOM(target);
        const line = this.view.state.doc.lineAt(position);
        console.log(`Checkbox toggled - Position: ${position} Line: ${line.text}`);

        const todoItem = new TodoItem(line.text);
		todoItem.setComplete(!todoItem.complete());
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

    private getTodoItemsInVisibleRangeWithPositions(): {from: number, to: number, item: TodoItem}[] {
      const res: {from: number, to: number, item: TodoItem}[] = [];
    
      var inBlock = false;
      for (const { from, to } of this.view.visibleRanges) {
        var currIdx = this.view.state.doc.lineAt(from).number;
        const endIdx = this.view.state.doc.lineAt(to).number;
        while (currIdx <= endIdx) {
          const currLine = this.view.state.doc.line(currIdx++);
          if (inBlock) {
            if (currLine.text.startsWith("\'\'\'")) {
              inBlock = false;
            } else {
              if (currLine.text.trim().length === 0) {
                continue;
              }
              res.push({from: currLine.from, to: currLine.to, item: new TodoItem(currLine.text)});
            }
          } else {
            if (currLine.text.startsWith("\'\'\'todotxt")) {
              inBlock = true;
            }
          }
        }
      }

      return res;
    }

	private updateView(spec: {from: number, to: number, insert: string}) {
		const transaction = this.view.state.update({changes: [spec]});
		this.view.dispatch(transaction);
	}
}

class TodoItemLine extends WidgetType {
  item: TodoItem;

  constructor(item: TodoItem) {
      super();
      this.item = item;
  }

  toDOM(view: EditorView): HTMLElement {
      const div = document.createElement("span");
      div.innerHTML = `<input type="checkbox" class="todotxt-md-item" id="${this.item.uuid}" ${this.item.complete() ? "checked" : ""}/><label for="${this.item.uuid}">${this.item.toString()}</label>`;

      return div;
  }
}
