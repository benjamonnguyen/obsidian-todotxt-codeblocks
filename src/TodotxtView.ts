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
    // private readonly view: EditorView;
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
        // this.view = view;

        // this.handleClickEvent = this.handleClickEvent.bind(this);
        // this.view.dom.addEventListener('click', this.handleClickEvent);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
    
      destroy() {}

    private buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
    
        var inBlock = false;
        for (const { from, to } of view.visibleRanges) {
          var currIdx = view.state.doc.lineAt(from).number;
          const endIdx = view.state.doc.lineAt(to).number;
          while (currIdx <= endIdx) {
            const currLine = view.state.doc.line(currIdx++);
            if (inBlock) {
              if (currLine.text.startsWith("\'\'\'")) {
                inBlock = false;
                // builder.add(currLine.from, currLine.to, Decoration.replace({widget: new HorizontalRule()}));
              } else {
                try {
                  builder.add(currLine.from, currLine.to, Decoration.replace({widget: new TodoItemLine(new TodoItem(currLine.text))}));
                } catch (e) {
                  console.error(e);
                }
              }
            } else {
              if (currLine.text.startsWith("\'\'\'todotxt")) {
                inBlock = true;
              }
            }
          }
        }

        return builder.finish();
      }

    // private handleClickEvent(event: MouseEvent): boolean {
    //     const { targetNode } = event;

    //     // Only handle checkbox clicks.
    //     if (!targetNode || !(targetNode instanceof HTMLInputElement) || targetNode.type !== 'checkbox') {
    //         return false;
    //     }

    //     if (!targetNode.hasClass("todotxt-md-item")) {
    //         return false;
    //     }

    //     /* Right now Obsidian API does not give us a way to handle checkbox clicks inside rendered-widgets-in-LP such as
    //      * callouts, tables, and transclusions because `this.view.posAtDOM` will return the beginning of the widget
    //      * as the position for any click inside the widget.
    //      * For callouts, this means that the task will never be found, since the `lineAt` will be the beginning of the callout.
    //      * Therefore, produce an error message pop-up using Obsidian's "Notice" feature, log a console warning, then return.
    //      */

    //     const { state } = this.view;
    //     const position = this.view.posAtDOM(targetNode);
    //     const line = state.doc.lineAt(position);
    //     console.log(`Checkbox toggled - Position: ${position} Line: ${line.text}`);

    //     /* Checkbox clicks will give pos of upper or lower fence.
    //      * Retain id for idx 
    //      * 
    //     */

    //     const todoItem = new TodoItem(line.text);

    //     /*
    //     // Only handle checkboxes of tasks.
    //     if (task === null) {
    //         return false;
    //     }

    //     // We need to prevent default so that the checkbox is only handled by us and not obsidian.
    //     event.preventDefault();

    //     // Clicked on a task's checkbox. Toggle the task and set it.
    //     const toggled = task.toggleWithRecurrenceInUsersOrder();
    //     const toggledString = toggled.map((t) => t.toFileLineString()).join(state.lineBreak);

    //     // Creates a CodeMirror transaction in order to update the document.
    //     const transaction = state.update({
    //         changes: {
    //             from: line.from,
    //             to: line.to,
    //             insert: toggledString,
    //         },
    //     });
    //     this.view.dispatch(transaction);

    //     // Dirty workaround.
    //     // While the code in this method properly updates the `checked` state
    //     // of the target checkbox, some Obsidian internals revert the state.
    //     // This means that the checkbox would remain in its original `checked`
    //     // state (`true` or `false`), even though the underlying document
    //     // updates correctly.
    //     // As a "fix", we set the checkbox's `checked` state *again* after a
    //     // timeout to revert Obsidian's wrongful reversal.
    //     const desiredCheckedStatus = target.checked;
    //     setTimeout(() => {
    //         target.checked = desiredCheckedStatus;
    //     }, 1);
    //     */

    //     return true;
    // }
}

class TodoItemLine extends WidgetType {
  item: TodoItem;

  constructor(item: TodoItem) {
      super();
      this.item = item;
  }

  toDOM(view: EditorView): HTMLElement {
      const div = document.createElement("span");
      div.innerHTML = `<input type="checkbox" class="todotxt-md-item" id="${this.item.uuid}"/><label for="${this.item.uuid}">${this.item.toString()}</label>`;

      return div;
  }
}

// class TodoListHeader extends WidgetType {
//   title: string = "Todo.txt";

//   constructor(configLine: string) {
//       super();
//       var title = "Todo.txt";
//       const sortStrings: string[] = [];
//       const filterStrings: string[] = [];
//       for (const [i, str] of configLine.split(" ").entries()) {
//           if (str.startsWith("sort:")) {
//               sortStrings.push(str.substring(4));
//           } else if (str.startsWith("filter:")) {
//               filterStrings.push(str.substring(6));
//           } else if (i === 1) {
//               title = str;
//           }
//       }
//   }

//   toDOM(view: EditorView): HTMLElement {
//       const div = document.createElement("div");
//       div.addClass("todotxt-md-list-header")
//       div.innerHTML = `${this.title}`;

//       return div;
//   }
// }