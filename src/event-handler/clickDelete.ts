import { MarkdownView } from 'obsidian';
import { ConfirmModal } from 'src/component';
import { findLine, updateView } from 'src/stateEditor';

export default function clickDelete(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;

	if (!target || !(target instanceof SVGElement)) {
		return false;
	}
	const newTarget = target.hasClass('todotxt-action-btn') ? target : target.parentElement;
	if (!newTarget || newTarget.getAttr('action') !== 'todotxt-delete-item') {
		return false;
	}

	const doDelete = () => {
		// @ts-ignore
		const view = mdView.editor.cm as EditorView;
		const line = findLine(newTarget, view);
		updateView(mdView, [{ from: line.from, to: line.to + 1 }]); // +1 to delete entire line
	};
	// @ts-ignore
	if (mdView.app.isMobile) {
		new ConfirmModal(mdView.app, 'Delete task?', doDelete).open();
	} else {
		doDelete();
	}

	return true;
}
