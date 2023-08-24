import { EditorView } from '@codemirror/view';
import { Line } from '@codemirror/state';
import { LanguageLine, TodoItem, ProjectGroupContainer, ActionType, ActionButton, TodoList } from "./model";
import { MarkdownView, Notice } from 'obsidian';
import { UNSAVED_ITEMS } from './todotxtBlockMdProcessor';
import { EditItemModal, AddModal, EditListOptionsModal, ConfirmModal } from "./component";
import TodotxtCodeblocksPlugin from './main';
import { ExtensionType } from './extension';

export function toggleCheckbox(event: MouseEvent, mdView: MarkdownView): boolean {
    const { target } = event;
    if (!target || !(target instanceof HTMLInputElement) || target.type !== "checkbox") {
        return false;
    }
    const itemEl = target.parentElement;
    if (!itemEl || !(itemEl instanceof HTMLDivElement) || itemEl.className !== TodoItem.HTML_CLS) {
        return false;
    }
    /* State changes do not persist to EditorView in Reading mode.
    * Create a notice and return true.
    */
    if (mdView.getMode() === "preview") {
        new Notice(TodotxtCodeblocksPlugin.NAME + " WARNING\nCheckbox toggle disabled in Reading View");
        event.preventDefault();
        return true;
    }
    
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    const itemIdx = parseInt(itemEl.id.match(/\d+$/)?.first()!);
    const pos = view.posAtDOM(itemEl);
    const listLine = view.state.doc.lineAt(pos);

    const { todoList, from, to } = TodoList.from(listLine.number, view);
    const item = todoList.items.at(itemIdx);
    if (item) {
        if (item.complete()) {
            item.clearCompleted();
            item.setComplete(false);
        } else {
            item.setCompleted(new Date());
            // if rec extension exists, automatically add new item with due and rec ext
            const recExt = item.getExtensions(ExtensionType.RECURRING);
            if (recExt.length) {
                const newItem = new TodoItem("");
                newItem.setPriority(item.priority());
                newItem.setBody(item.body());
                newItem.setExtension(ExtensionType.DUE, recExt.first()!.value);
                todoList.items.push(newItem);
            }
        }
    }

    todoList.sort();
    event.preventDefault();
    updateView(mdView, [{from, to, insert: todoList.toString()}]);
    return true;
}

export function toggleProjectGroup(event: MouseEvent, mdView: MarkdownView): boolean {
    const { target } = event;
    if (!target || !(target instanceof HTMLInputElement) || target.type !== "checkbox"
        || !target.hasClass(ProjectGroupContainer.CHECKBOX_CLS)) {
        return false;
    }
    /* State changes do not persist to EditorView in Reading mode.
    * Create a notice and return true.
    */
    if (mdView.getMode() === "preview") {
        event.preventDefault();
        return true;
    }
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    const line = findLine(target, view);
    const { langLine } = LanguageLine.from(line.text);
    const project = target.labels?.item(0).getText().substring(1);
    if (!project) return false;

    if (target.getAttr("checked")) {
        langLine.collapsedProjectGroups.add(project);
    } else {
        langLine.collapsedProjectGroups.delete(project);
    }
    
    updateView(mdView, [{from: line.from, to: line.to, insert: langLine.toString()}]);
    return true;
}

export function clickEdit(event: MouseEvent, mdView: MarkdownView): boolean {
    const { target } = event;

    if (!target || !(target instanceof SVGElement)) {
        return false;
    }
    const editBtnEl = target.hasClass("todotxt-action-btn") ? target : target.parentElement;
    if (!editBtnEl || editBtnEl.getAttr("action") !== ActionType.EDIT.name) {
        return false;
    }
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    const pos = view.posAtDOM(editBtnEl);
    const listLine = view.state.doc.lineAt(pos);
    const { todoList, from, to } = TodoList.from(listLine.number, view);

    if (editBtnEl.id === EditItemModal.ID) {
        const itemIdx = parseInt(editBtnEl.getAttr("item-id")?.match(/\d+$/)?.first()!);
        const itemLine = view.state.doc.line(listLine.number + 1 + itemIdx);

        new EditItemModal(mdView.app, itemLine.text, result => {
            todoList.items[itemIdx] = new TodoItem(result);
            todoList.sort();
            updateView(mdView, [{from, to, insert: todoList.toString()}]);
        }).open();
    } else if (editBtnEl.id === EditListOptionsModal.ID) {
        const { langLine } = LanguageLine.from(listLine.text);
        
        new EditListOptionsModal(this.app, langLine, result => {
            todoList.langLine.title = result.title;
            todoList.langLine.sortFieldToOrder.clear();
            result.sortOrders.split(" ")
                .map(sortOrder => LanguageLine.handleSort(sortOrder))
                .forEach(res => {
                    if (!(res instanceof Error)) {
                        todoList.langLine.sortFieldToOrder.set(res.field, res.order);
                    }
                });
            todoList.sort();
            updateView(mdView, [{from, to, insert: todoList.toString()}]);
        }).open();
    }
    
    return true;
}

export function clickAdd(event: MouseEvent, mdView: MarkdownView): boolean {
    const { target } = event;

    if (!target || !(target instanceof SVGElement)) {
        return false;
    }
    const newTarget = target.hasClass("todotxt-action-btn") ? target : target.parentElement;
    const listId = newTarget?.getAttr("item-id");
    if (!newTarget || newTarget.getAttr("action") !== ActionType.ADD.name || !listId) {
        return false;
    }
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    const listLine = findLine(document.getElementById(listId)!, view);

    const { todoList, from, to } = TodoList.from(listLine.number, view);
    new AddModal(mdView.app, result => {
        todoList.items.push(new TodoItem(result));
        todoList.sort();
        updateView(mdView, [{from, to, insert: todoList.toString()}]);
    }).open();
    
    return true;
}

export function clickDelete(event: MouseEvent, mdView: MarkdownView): boolean {
    const { target } = event;

    if (!target || !(target instanceof SVGElement)) {
        return false;
    }
    const newTarget = target.hasClass("todotxt-action-btn") ? target : target.parentElement;
    if (!newTarget || newTarget.getAttr("action") !== ActionType.DEL.name) {
        return false;
    }

    const doDelete = () => {
        // @ts-ignore
        const view = mdView.editor.cm as EditorView;
        const line = findLine(newTarget, view);
        updateView(mdView, [{from: line.from, to: line.to + 1}]); // +1 to delete entire line
    };
    // @ts-ignore
    if (mdView.app.isMobile) {
        new ConfirmModal(mdView.app, "Delete task?", doDelete).open();
    } else {
        doDelete();
    }
    
    return true;
}

export function save(mdView: MarkdownView) {
    if (!UNSAVED_ITEMS || !UNSAVED_ITEMS.length) return;
    // State changes do not persist to EditorView in Reading mode.
    if (mdView.getMode() === "preview") return;
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    
    const items = [...UNSAVED_ITEMS];
    UNSAVED_ITEMS.length = 0;
    const changes: {from: number, to: number, insert?: string}[] = [];
    
    items.forEach(({ listId, line, newText }) => {
        const list = document.getElementById(listId);
        if (!list) return;
        const listLine = findLine(list, view);

        const itemLine = view.state.doc.line(listLine.number + line);
        if (newText) {
            changes.push({from: itemLine.from, to: itemLine.to, insert: newText});
        } else {
            changes.push({from: itemLine.from, to: itemLine.to + 1});
        }
    });

    updateView(mdView, changes);
    var noticeMsg = TodotxtCodeblocksPlugin.NAME + " SAVING\n";
    changes.filter(c => c.insert).forEach(c => noticeMsg += `- ${c.insert}\n`);
    new Notice(noticeMsg, 2500);
}

function findLine(el: Element, view: EditorView): Line {
    const pos = view.posAtDOM(el);
    const line = view.state.doc.lineAt(pos);
    // console.log("pos", pos, "- line", line);
    
    if (el.hasClass(TodoItem.HTML_CLS)) {
        /* Workaround since view.posAtDOM(codeBlockLine) returns the position
        * of the start of the code block.
        */
        const itemIdx = parseInt(el.id.match(/\d+$/)?.first()!);
        
        return view.state.doc.line(line.number + 1 + itemIdx);
    } else if (el.hasClass(ActionButton.HTML_CLASS)
        && el.id !== EditListOptionsModal.ID) {
        const itemIdx = parseInt(el.getAttr("item-id")?.match(/\d+$/)?.first()!);
        
        return view.state.doc.line(line.number + 1 + itemIdx);
    }
    
    return view.state.doc.lineAt(pos);
}

function updateView(mdView: MarkdownView, changes: {from: number, to?: number, insert?: string}[]) {
    console.log("changes:", changes);
    save(mdView); // Prevent race condition by checking if there are UNSAVED_ITEMS pending
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    const transaction = view.state.update({changes: changes});
    view.dispatch(transaction);
}
