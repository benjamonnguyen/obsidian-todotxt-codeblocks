import { EditorView } from '@codemirror/view';
import { Line } from '@codemirror/state';
import { LanguageLine, TodoItem, ProjectGroupContainer, ActionType, ActionButton } from "./model";
import { App, MarkdownView, Notice } from 'obsidian';
import { UNSAVED_ITEMS } from './todotxtBlockMdProcessor';
import { EditModal } from "./component";
import AddModal from './component/AddModal';

export function toggleCheckbox(event: MouseEvent, mdView: MarkdownView): boolean {
    const { target } = event;
    
    if (!target || !(target instanceof HTMLInputElement) || target.type !== "checkbox") {
        return false;
    }
    const span = target.parentElement;
    if (!span || !(span instanceof HTMLSpanElement) || span.className !== TodoItem.HTML_CLS) {
        return false;
    }
    /* State changes do not persist to EditorView in Reading mode.
    * Create a notice and return true.
    */
    if (mdView.getMode() === "preview") {
        new Notice("obsidian-inline-todotxt WARNING\nCheckbox toggle disabled in Reading View");
        event.preventDefault();
        return true;
    }
    
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    
    const line = findLine(span, view);
    const todoItem = new TodoItem(line.text);
    if (todoItem.complete()) {
        todoItem.clearCompleted();
        todoItem.setComplete(false);
    } else {
        todoItem.setCompleted(new Date());
    }
    
    event.preventDefault();
    updateView(view, [{from: line.from, to: line.to, insert: todoItem.toString()}]);
    
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
    
    updateView(view, [{from: line.from, to: line.to, insert: langLine.toString()}]);
    
    return true;
}

export function clickEdit(event: MouseEvent, mdView: MarkdownView, app: App): boolean {
    const { target } = event;

    if (!target || !(target instanceof SVGElement)) {
        return false;
    }
    const newTarget = target.hasClass("todotxt-action-btn") ? target : target.parentElement;
    if (!newTarget || newTarget.getAttr("action") !== ActionType.EDIT.name) {
        return false;
    }
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;

    const line = findLine(newTarget, view);
    new EditModal(app, line.text, result =>
        updateView(view, [{from: line.from, to: line.to, insert: result}])
    ).open();
    
    return true;
}

export function clickAdd(event: MouseEvent, mdView: MarkdownView, app: App): boolean {
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
    const line = findLine(document.getElementById(listId)!, view);

    new AddModal(app, result => {
        updateView(view, [{from: line.to + 1, insert: result + "\n"}])
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
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;

    const line = findLine(newTarget, view);
    updateView(view, [{from: line.from, to: line.to + 1}]); // +1 to delete entire line
    
    return true;
}

export function save(mdView: MarkdownView) {
    if (!UNSAVED_ITEMS || !UNSAVED_ITEMS.length) return;
    // State changes do not persist to EditorView in Reading mode.
    if (mdView.getMode() === "preview") return;
    // @ts-ignore
    const view = mdView.editor.cm as EditorView;
    
    const items = [...UNSAVED_ITEMS];
    UNSAVED_ITEMS.length = 0; // TODO race condition?
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

    updateView(view, changes);
    var noticeMsg = "obsidian-inline-todotxt SAVING\n";
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
    } else if (el.hasClass(ActionButton.HTML_CLASS)) {
        const itemIdx = parseInt(el.getAttr("item-id")?.match(/\d+$/)?.first()!);
        
        return view.state.doc.line(line.number + 1 + itemIdx);
    }
    
    return view.state.doc.lineAt(pos);
}

function updateView(view: EditorView, changes: {from: number, to?: number, insert?: string}[]) {
    console.log("changes:", changes);
    const transaction = view.state.update({changes: changes});
    view.dispatch(transaction);
}
