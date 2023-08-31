import { Notice } from 'obsidian';
import TodotxtCodeblocksPlugin from 'src/main';
import { TodoItem } from './model';
import { calculateDate } from './dateUtil';

export enum ExtensionType {
	DUE = 'due',
	RECURRING = 'rec',
}

export function processExtensions(item: TodoItem) {
	processDueExtension(item);
	processRecurringExtension(item);
}

function processDueExtension(item: TodoItem) {
	const ext = invalidateDuplicates(item, ExtensionType.DUE);
	if (ext) {
		try {
			const { date, details } = calculateDate(ext.value);
			if (date === ext.value) return;
			item.setExtension(ExtensionType.DUE, date);
			let msg = 'Due date set to ' + date;
			if (details) {
				msg += `\n(${details})`;
			}
			new Notice(TodotxtCodeblocksPlugin.NAME + ' INFO\n' + msg, 10000);
		} catch (e) {
			handleError(e, item, ext);
		}
	}
}

function processRecurringExtension(item: TodoItem) {
	const ext = invalidateDuplicates(item, ExtensionType.RECURRING);
	if (ext) {
		try {
			calculateDate(ext.value);
		} catch (e) {
			handleError(e, item, ext);
		}
	}
}

// invalidate duplicates and return first extension
function invalidateDuplicates(
	item: TodoItem,
	extType: ExtensionType,
): { key: string; value: string } | undefined {
	const extensions = item.getExtensionValuesAndBodyIndices(extType);
	if (extensions.length) {
		if (
			item.invalidateExtensions(extType, undefined, extensions.map(({ index }) => index).slice(1))
		) {
			const msg = 'Invalidated duplicates of reserved extension: ' + extType;
			console.warn(msg);
			new Notice(TodotxtCodeblocksPlugin.NAME + ' WARNING\n' + msg, 10000);
		}

		return { key: extType, value: extensions[0].value };
	}
}

function handleError(e: Error, item: TodoItem, extension: { key: string; value: string }) {
	item.invalidateExtensions(extension.key, extension.value);
	let errMsg = `Invalid value for "${extension.key}" extension: ${extension.value}`;
	if (e.message) {
		errMsg += '\nerror: ' + e.message;
	}
	console.warn(errMsg);
	new Notice(TodotxtCodeblocksPlugin.NAME + ' WARNING\n' + errMsg, 10000);
}
