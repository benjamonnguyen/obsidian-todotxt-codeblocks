import { MarkdownView } from 'obsidian';

export default function clickLink(event: MouseEvent, mdView: MarkdownView): boolean {
	const { target } = event;
	if (!target || !(target instanceof HTMLSpanElement)) {
		return false;
	}
	const link = target.getAttr('link');
	if (target.hasClass('todotxt-link') && link) {
		try {
			window.open(new URL(link));
			return true;
		} catch (_) {
			/* empty */
		}
		mdView.app.workspace.openLinkText(link, link);
		return true;
	}
	return false;
}
