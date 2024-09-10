import { PluginSettingTab, App, Setting } from 'obsidian';
import TodotxtCodeblocksPlugin from './main';

export type Priority = 'A' | 'B' | 'C' | 'D' | 'none';
export type ArchiveBehavior = 'archive' | 'delete';

export interface PluginSettings {
	sortDefaultOptions: string;
	applySortDefault: boolean;
	enableInfoNotices: boolean;
	defaultPriority: Priority;
	archiveBehavior: ArchiveBehavior;
	autoArchiveThreshold: number;
	archiveFilePath: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	sortDefaultOptions: 'sort:status sort:prio sort:completed sort:due sort:created',
	applySortDefault: true,
	enableInfoNotices: true,
	defaultPriority: 'A',
	archiveBehavior: 'archive',
	autoArchiveThreshold: -1,
	archiveFilePath: 'archive.txt',
};

export class SettingsTab extends PluginSettingTab {
	plugin: TodotxtCodeblocksPlugin;

	constructor(app: App, plugin: TodotxtCodeblocksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		this.containerEl.empty();

		this.archiveBehaviorDropDown();
		this.autoArchiveThresholdSlider();
		this.archiveFilePath();
		this.applySortDefault();
		this.enableInfoNotices();
		this.containerEl.createEl('h3', { text: 'Defaults' });
		this.sortDefaultOptions();
		this.defaultPriority();
	}

	private applySortDefault(): Setting {
		return new Setting(this.containerEl)
			.setName('Apply "sort:default" option automatically')
			.setDesc('Applies "sort:default" if no sort options are provided.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.applySortDefault).onChange(async (value) => {
					this.plugin.settings.applySortDefault = value;
					this.plugin.saveSettings();
				});
			});
	}

	private sortDefaultOptions(): Setting {
		return new Setting(this.containerEl)
			.setName('"sort:default" options')
			.setDesc('Sort options to apply when using "sort:default".')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.sortDefaultOptions)
					.onChange(async (value) => {
						this.plugin.settings.sortDefaultOptions = value;
						this.plugin.saveSettings();
					})
					.setPlaceholder(DEFAULT_SETTINGS.sortDefaultOptions || ''),
			);
	}

	private defaultPriority(): Setting {
		return new Setting(this.containerEl).setName('Priority').addDropdown((dropDown) => {
			dropDown
				.addOptions({
					A: '(A)',
					B: '(B)',
					C: '(C)',
					D: '(D)',
				})
				.setValue(this.plugin.settings.defaultPriority)
				.onChange(async (val) => {
					// @ts-ignore
					this.plugin.settings.defaultPriority = val;
					this.plugin.saveSettings();
				});
		});
	}

	private enableInfoNotices(): Setting {
		return new Setting(this.containerEl)
			.setName('Enable INFO level notices')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.enableInfoNotices).onChange(async (value) => {
					this.plugin.settings.enableInfoNotices = value;
					this.plugin.saveSettings();
				});
			});
	}

	private archiveBehaviorDropDown(): Setting {
		return new Setting(this.containerEl)
			.setName('Archive behavior')
			.setDesc('What happens when a task is archived.')
			.addDropdown((dropDown) => {
				dropDown
					.addOptions({
						archive: 'Move completed tasks to archive.txt file',
						delete: 'Delete completed tasks permanently',
					})
					.setValue(this.plugin.settings.archiveBehavior)
					.onChange(async (val) => {
						// @ts-ignore
						this.plugin.settings.archiveBehavior = val;
						this.plugin.saveSettings();
					});
			});
	}

	private autoArchiveThresholdSlider(): Setting {
		return new Setting(this.containerEl)
			.setName('Auto-archive threshold')
			.setDesc(
				'Archives tasks when their completed date is older than [X] days. Setting threshold to -1 disables auto-archiving.',
			)
			.addSlider((slider) => {
				slider
					.setLimits(-1, 30, 1)
					.setValue(this.plugin.settings.autoArchiveThreshold)
					.onChange(async (val) => {
						this.plugin.settings.autoArchiveThreshold = val;
						this.plugin.saveSettings();
					});
				slider.setDynamicTooltip();
			});
	}

	private archiveFilePath(): Setting {
		return new Setting(this.containerEl)
			.setName('Archive file path')
			.setDesc('Path of txt file tasks are archived to.')
			.addTextArea((txt) => {
				txt
					.setPlaceholder('path/to/*.txt')
					.setValue(this.plugin.settings.archiveFilePath)
					.onChange(async (val) => {
						this.plugin.settings.archiveFilePath = val;
						this.plugin.saveSettings();
					});
			});
	}
}
