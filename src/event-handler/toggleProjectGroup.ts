import { MarkdownView } from 'obsidian';
import { ProjectGroupContainer, LanguageLine } from 'src/model';
import { updateDocument, findLine } from 'src/documentUtil';

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

	if (langLine.collapsedProjectGroups.has(project)) {
		langLine.collapsedProjectGroups.delete(project);
	} else {
		langLine.collapsedProjectGroups.add(project);
	}

	updateDocument(mdView, [{ from: line.from, to: line.to, insert: langLine.toString() }]);
	return true;
}
