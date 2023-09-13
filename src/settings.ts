import { PluginSettingTab, App, Setting } from 'obsidian';
import TodotxtCodeblocksPlugin from './main';

export interface PluginSettings {
	sortDefaultOptions: string;
	applySortDefault: boolean;
	enableInfoNotices: boolean;
}

export const DEFAULT_SETTINGS: Partial<PluginSettings> = {
	sortDefaultOptions: 'status,prio,completed,due,created',
	applySortDefault: true,
	enableInfoNotices: true,
};

export class SettingsTab extends PluginSettingTab {
	plugin: TodotxtCodeblocksPlugin;

	constructor(app: App, plugin: TodotxtCodeblocksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.applySortDefault(containerEl);
		this.sortDefaultOptions(containerEl);
		this.enableInfoNotices(containerEl);
	}

	private applySortDefault(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Apply "sort:default" option automatically')
			.setDesc('Applies "sort:default" if no sort options are provided')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.applySortDefault).onChange(async (value) => {
					this.plugin.settings.applySortDefault = value;
					await this.plugin.saveSettings();
				});
			});
	}

	private sortDefaultOptions(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('"sort:default" options')
			.setDesc('Comma delimited list of sort options to apply for "sort:default"')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.sortDefaultOptions)
					.onChange(async (value) => {
						this.plugin.settings.sortDefaultOptions = value;
						await this.plugin.saveSettings();
					})
					.setPlaceholder(DEFAULT_SETTINGS.sortDefaultOptions || ''),
			);
	}

	private enableInfoNotices(containerEl: HTMLElement): Setting {
		return new Setting(containerEl).setName('Enable INFO level notices').addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.enableInfoNotices).onChange(async (value) => {
				this.plugin.settings.enableInfoNotices = value;
				await this.plugin.saveSettings();
			});
		});
	}
}
