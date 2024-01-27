import { TFile } from 'obsidian';

export const SOURCEPATH_TO_LISTID = new Map<string, string>();

export async function readFromFile(path: string): Promise<string> {
	const file = app.vault.getAbstractFileByPath(path) as TFile;
	if (file) {
		return app.vault.cachedRead(file);
	} else {
		await app.vault.create(path, '');
		return '';
	}
}

export function writeToFile(path: string, data: string) {
	const file = app.vault.getAbstractFileByPath(path) as TFile;
	if (file) {
		app.vault.modify(file, data);
	} else {
		app.vault.create(path, data);
	}
}
