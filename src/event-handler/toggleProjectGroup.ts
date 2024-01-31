import { MarkdownView } from 'obsidian';
import { ProjectGroupContainer, LanguageLine, TodoList } from 'src/model';
import { findLine } from 'src/documentUtil';
import { update } from 'src/stateEditor';

export default function toggleProjectGroup(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;
	if (
		!target ||
		!(target instanceof HTMLInputElement) ||
		target.type !== 'checkbox' ||
		!target.hasClass(ProjectGroupContainer.CHECKBOX_CLS)
	) {
		return false;
	}
	/* State changes do not persist to EditorView in Reading mode.
	 * Create a notice and return true.
	 */
	if (mdView.getMode() === 'preview') {
		event.preventDefault();
		return true;
	}
	const line = findLine(target);
	const res = LanguageLine.from(line.text);
	if (res instanceof Error) {
		console.log('ERROR: toggleProjectGroup:', res.message);
		return true;
	}
	const { langLine } = res;
	const project = target.labels?.item(0).getText().substring(1);
	if (!project) return false;

	if (langLine.collapsedProjectGroups.has(project)) {
		langLine.collapsedProjectGroups.delete(project);
	} else {
		langLine.collapsedProjectGroups.add(project);
	}

	const { from, to, todoList } = TodoList.from(target);
	const newList = new TodoList(langLine, todoList.items());
	update(from, to, newList);
	return true;
}
