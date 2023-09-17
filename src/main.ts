import { MarkdownView, Plugin } from 'obsidian';
import { saveChanges, todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import {
	toggleCheckbox,
	toggleProjectGroup,
	clickEdit,
	clickAdd,
	clickDelete,
	clickLink,
	clickArchive,
} from './event-handler';
import { createNewTaskCmd } from './command';
import { PluginSettings, SettingsTab, DEFAULT_SETTINGS } from './settings';
import { autoArchive } from './event-handler/archive';

export let SETTINGS_READ_ONLY: PluginSettings;

export default class TodotxtCodeblocksPlugin extends Plugin {
	static NAME = 'obsidian-todotxt-codeblocks';
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
		this.registerExtensions(['todotxt'], 'markdown');
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
		this.registerDomEvent(document, 'keypress', (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				const actionBtn = document
					.getElementsByClassName('mod-cta')
					.item(0) as HTMLButtonElement | null;
				actionBtn?.click();
			}
		});
		this.registerInterval(
			window.setInterval(
				() => saveChanges(this.app.workspace.getActiveViewOfType(MarkdownView)),
				2000,
			),
		);
		this.registerInterval(
			window.setInterval(
				() => autoArchive(this.app.workspace.getActiveViewOfType(MarkdownView)),
				5 * 60000,
			),
		);
		this.addCommand(createNewTaskCmd);
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
		await this.saveData(this.settings).then(
			() => (SETTINGS_READ_ONLY = Object.freeze({ ...this.settings })),
		);
	}
}
