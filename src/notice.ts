import { Notice } from 'obsidian';
import TodotxtCodeblocksPlugin, { SETTINGS_READ_ONLY } from './main';

export enum Level {
	INFO = 'INFO',
	WARN = 'WARNING',
	ERR = 'ERROR',
}

export function notice(message: string, level: Level, durationMs = 5000) {
	if (level === Level.INFO && !SETTINGS_READ_ONLY.enableInfoNotices) {
		return;
	}
	new Notice(TodotxtCodeblocksPlugin.NAME + ` ${level}\n` + message, durationMs);
}
