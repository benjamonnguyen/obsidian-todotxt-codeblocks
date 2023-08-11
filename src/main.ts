import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import { toggleCheckbox, toggleProjectGroup, save, clickEdit, clickDelete, clickAdd } from './stateEditor';

// TODO Remember to rename these classes and interfaces!

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

export default class MyPlugin extends Plugin {

	static NAME = "obsidian-todotxt-codeblocks";
	// settings: MyPluginSettings;

	async onload() {
		// await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("todotxt", todotxtBlockProcessor);
		this.registerDomEvent(document, "click", (event: MouseEvent) => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (mdView) {
				toggleCheckbox(event, mdView)
					|| toggleProjectGroup(event, mdView)
					|| clickEdit(event, mdView, this.app)
					|| clickDelete(event, mdView)
					|| clickAdd(event, mdView, this.app)
					;
			}
		});
		this.registerInterval(window.setInterval(() => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			save(mdView!);
		}, 2000));

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
