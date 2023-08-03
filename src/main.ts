import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {EditorView} from "@codemirror/view";
import { todotxtBlockProcessor } from './todotxtBlockMdProcessor';
import { todotxtView } from './stateEditor';

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

		this.registerEditorExtension([todotxtView]);
		this.registerMarkdownCodeBlockProcessor("todotxt", todotxtBlockProcessor);
		this.registerDomEvent(document, "click", (event: MouseEvent) => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			// @ts-ignore
			(mdView?.editor.cm as EditorView)
				?.plugin(todotxtView)
				?.toggleCheckbox(event, mdView!);
		});
		this.registerInterval(window.setInterval(() => {
			const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			// @ts-ignore
			(mdView?.editor.cm as EditorView)
				?.plugin(todotxtView)
				?.save(mdView!);
		}, 2000));

		// @context is treated as #tags
		// +Project are treated at [[Project]]. You can ctrl click them.
		// _ in +Projects to represent spaces. Ex +Hello_World

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
