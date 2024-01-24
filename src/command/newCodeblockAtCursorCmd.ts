import { Editor, MarkdownView } from 'obsidian';

export default {
	id: 'new-codeblock-at-cursor',
	name: 'New codeblock at cursor',
	editorCallback: (e: Editor, view: MarkdownView) => {
		const n = e.getCursor().line;
		const text = e.getLine(n);
		e.setLine(n, `\`\`\`todotxt\n\`\`\`\n${text}`);
		e.setCursor(n + 2);
	},
};
