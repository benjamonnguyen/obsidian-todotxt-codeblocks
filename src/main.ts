import { App, MarkdownView, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import { toggleCheckbox, toggleProjectGroup, save } from './stateEditor';

// TODO Remember to rename these classes and interfaces!

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

export default class MyPlugin extends Plugin {
	// settings: MyPluginSettings;

	async onload() {
		// await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("todotxt", todotxtBlockProcessor);
		this.registerDomEvent(document, "click", (event: MouseEvent) => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (mdView) {
				toggleCheckbox(event, mdView) || toggleProjectGroup(event, mdView);
			}
			// TODO clickPriority();
		});
		this.registerInterval(window.setInterval(() => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			save(mdView!);
		}, 2000));

		// @context is treated as #tags

		// TODO 1. View interactivity (edit/delete)

		// TODO 2. Settings (defaults)
		
		// TODO 3. Archive file (cron?)

		// TODO x. Suggestor / natural language dates

		// TODO x. Querier (by context and project)

		// TODO x. Rollover

		// TODO x. Import command

		// TODO x. Export as *.txt

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
	}

// 	async loadSettings() {
// 		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
// 	}

// 	async saveSettings() {
// 		await this.saveData(this.settings);
// 	}
// }

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const {containerEl} = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('It\'s a secret')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));
// 	}
}
