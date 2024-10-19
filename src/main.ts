import { MarkdownView, Plugin } from 'obsidian';
import { todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import { clickAdd, clickDelete, clickLink, clickArchive } from './event-handler';
import { createNewTaskCmd, newCodeblockAtCursorCmd } from './command';
import { PluginSettings, SettingsTab, DEFAULT_SETTINGS } from './settings';
import { autoArchive } from './event-handler/archive';
import { synchronize } from './link';
import { TodoList } from './model';

export let SETTINGS_READ_ONLY: PluginSettings;
export default class TodotxtCodeblocksPlugin extends Plugin {
	static NAME = 'Todo.txt Codeblocks';
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
		try {
			this.registerExtensions(['txt'], 'markdown');
		} catch (_) {
			/* empty */
		}
		this.registerMarkdownCodeBlockProcessor('todotxt', todotxtBlockProcessor);
		this.registerDomEvent(
			document,
			'click',
			async (event: MouseEvent) => {
				const { target } = event;
				if (!target) return;

				const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (mdView) {
					if ((target as Element).matchParent('.' + TodoList.HTML_CLS)) {
						try {
							if (await synchronize()) {
								event.preventDefault();
								return;
							}
						} catch (_) {
							//
						}
					}

					// TODO refactor to remove this pattern. Use per element event handlers instead.
					const handled =
						clickLink(event, mdView) ||
						clickAdd(target, mdView) ||
						clickDelete(event, mdView) ||
						clickArchive(event, mdView);

					if (handled) {
						autoArchive(mdView);
					}
				}
			},
			true,
		); // execute on capture phase
		// TODO configurable sync interval (0 = never)
		this.registerInterval(
			window.setInterval(
				() =>
					synchronize().catch(() => {
						//
					}),
				5000,
			),
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

	onunload() {
		//
	}

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
