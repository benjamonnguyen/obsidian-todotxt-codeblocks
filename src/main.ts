import { MarkdownView, Plugin } from 'obsidian';
import { todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import {
	toggleCheckbox,
	toggleProjectGroup,
	clickEdit,
	clickAdd,
	clickDelete,
	clickLink,
	clickArchive,
} from './event-handler';
import { createNewTaskCmd, newCodeblockAtCursorCmd } from './command';
import { PluginSettings, SettingsTab, DEFAULT_SETTINGS } from './settings';
import { autoArchive } from './event-handler/archive';
import { SOURCEPATH_TO_LISTID, readFromFile } from './link';
import { TodoItem, TodoList } from './model';
import { findLine } from './documentUtil';
import { update } from './stateEditor';
import { Level, notice } from './notice';

export let SETTINGS_READ_ONLY: PluginSettings;

export default class TodotxtCodeblocksPlugin extends Plugin {
	static NAME = 'Todo.txt Codeblocks';
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
		this.registerExtensions(['txt'], 'markdown');
		this.registerMarkdownCodeBlockProcessor('todotxt', todotxtBlockProcessor);
		this.registerDomEvent(document, 'click', (event: MouseEvent) => {
			const { target } = event;
			if (!target) return;

			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (mdView) {
				const handled =
					clickLink(event, mdView) ||
					toggleCheckbox(event, mdView) ||
					toggleProjectGroup(event, mdView) ||
					clickEdit(event, mdView) ||
					clickAdd(target, mdView) ||
					clickDelete(event, mdView) ||
					clickArchive(event, mdView);

				if (handled) {
					autoArchive(mdView);
				}
			}
		});
		// @ts-ignore
		const cm = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor.cm as EditorView;
		this.registerInterval(
			window.setInterval(async () => {
				for (const [src, id] of SOURCEPATH_TO_LISTID) {
					const el = document.getElementById(id);
					if (!el) return;
					const line = findLine(el, cm);
					const { from, to, todoList } = TodoList.from(line.number, cm);
					const langLine = todoList.languageLine();
					const codeblock = todoList
						.items()
						.map((item) => item.toString())
						.join('\n');
					const file = await readFromFile(src);
					if (codeblock != file) {
						const newTodoList = new TodoList(
							langLine,
							file
								.split('\n')
								.filter((line) => !!line)
								.map((line) => new TodoItem(line)),
						);
						newTodoList.sort();
						update(from, to, newTodoList);
						notice(`synchronized ${langLine.title} with linked file: ${src}`, Level.INFO);
					}
				}
			}, 5000),
		);
		this.registerInterval(
			window.setInterval(
				() => autoArchive(this.app.workspace.getActiveViewOfType(MarkdownView)),
				5 * 60000,
			),
		);
		this.addCommand(createNewTaskCmd);
		this.addCommand(newCodeblockAtCursorCmd);
	}

	onunload() {}

	async loadSettings() {
		/*
		 * Object.assign() copies the references to any nested properties (shallow copy).
		 * If your settings object contains nested properties, you need to copy each nested property recursively (deep copy).
		 * Otherwise, any changes to a nested property will apply do all objects that were copied using Object.assign().
		 */
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		SETTINGS_READ_ONLY = Object.freeze({ ...this.settings });
	}

	async saveSettings() {
		this.saveData(this.settings);
		SETTINGS_READ_ONLY = Object.freeze({ ...this.settings });
	}
}
