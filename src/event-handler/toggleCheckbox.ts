import { MarkdownView, moment } from 'obsidian';
import { ExtensionType } from 'src/extension';
import { TodoItem, TodoList } from 'src/model';
import { calculateDate } from 'src/dateUtil';
import { updateDocument } from 'src/stateEditor';
import { notice, Level } from 'src/notice';

export default function toggleCheckbox(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;
	if (!target || !(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
		return false;
	}
	const itemEl = target.parentElement;
	if (!itemEl || !(itemEl instanceof HTMLDivElement) || itemEl.className !== TodoItem.HTML_CLS) {
		return false;
	}
	/* State changes do not persist to EditorView in Reading mode.
	 * Create a notice and return true.
	 */
	if (mdView.getMode() === 'preview') {
		notice('Checkbox toggle disabled in Reading View', Level.WARN);
		event.preventDefault();
		return true;
	}

	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const itemIdx = itemEl.id.match(TodoItem.ID_REGEX)?.at(1);
	if (!itemIdx) {
		console.error('Item element has invalid id: ' + itemEl.id);
		return true;
	}
	const pos = view.posAtDOM(itemEl);
	const listLine = view.state.doc.lineAt(pos);

	const { todoList, from, to } = TodoList.from(listLine.number, view);
	const idx = parseInt(itemIdx);
	const item = todoList.items().at(idx);
	if (item) {
		if (item.complete()) {
			item.clearCompleted();
			item.setComplete(false);
			todoList.sort();
		} else {
			todoList.removeItem(idx);
			item.setCompleted(new Date());
			todoList.add(item);
			// if rec extension exists, automatically add new item with due and rec ext
			const recExt = item.getExtensionValuesAndBodyIndices(ExtensionType.RECURRING);
			if (recExt.at(0)) {
				const recurringTask = createRecurringTask(recExt[0].value, item);
				if (recurringTask) {
					todoList.add(recurringTask);
				}
			}
		}
	}

	event.preventDefault();
	updateDocument(mdView, [{ from, to, insert: todoList.toString() }]);
	return true;
}

function createRecurringTask(rec: string, originalItem: TodoItem): TodoItem | undefined {
	try {
		const hasPlusPrefix = rec.startsWith('+');
		const { date, details } = calculateDate(
			rec,
			hasPlusPrefix
				? moment(originalItem.getExtensionValuesAndBodyIndices(ExtensionType.DUE).first()?.value)
				: null,
		);
		const newItem = new TodoItem('');
		newItem.setPriority(originalItem.priority());
		newItem.setBody(originalItem.getBody());
		newItem.setExtension(ExtensionType.DUE, date);

		let msg = 'Created recurring task due: ' + date;
		if (details) {
			let deets = details;
			if (hasPlusPrefix) {
				deets += ', + option';
			}
			msg += `\n(${deets})`;
		}
		notice(msg, Level.INFO, 10000);

		return newItem;
	} catch (e) {
		console.error(e);
		notice('Failed to create recurring task', Level.ERR);
	}
}
