import { MarkdownView } from 'obsidian';
import { ProjectGroupContainer, LanguageLine } from 'src/model';
import { updateView, findLine } from 'src/stateEditor';

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
	// @ts-ignore
	const view = mdView.editor.cm as EditorView;
	const line = findLine(target, view);
	const { langLine } = LanguageLine.from(line.text);
	const project = target.labels?.item(0).getText().substring(1);
	if (!project) return false;

	if (target.getAttr('checked')) {
		langLine.collapsedProjectGroups.add(project);
	} else {
		langLine.collapsedProjectGroups.delete(project);
	}

	updateView(mdView, [{ from: line.from, to: line.to, insert: langLine.toString() }]);
	return true;
}
