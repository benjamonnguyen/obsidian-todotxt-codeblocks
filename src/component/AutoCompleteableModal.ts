import { AbstractTextComponent, App } from 'obsidian';
import { TodotxtModal } from './TodotxtModal';

export default abstract class AutoCompleteableModal extends TodotxtModal {
	private prefixToSuggestionOptions: Map<string, string[]>;
	private prevTextLength = 0;
	private prevSelectedWord = '';
	private filteredSuggestions: string[] | null = null;

	constructor(prefixToSuggestionOptions: Map<string, string[]>) {
		super();
		this.prefixToSuggestionOptions = new Map(prefixToSuggestionOptions.entries());
	}

	suggest(
		text: string,
		textComponent: AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>,
	): boolean {
		const res = (() => {
			// Only suggest on text insertion
			if (text.length <= this.prevTextLength) {
				this.prevTextLength = text.length;
				return false;
			}
			this.prevTextLength = text.length;

			// Only suggest on text insertion to end of word
			const cursor = textComponent.inputEl.selectionStart;
			if (cursor === null || (cursor !== text.length && text.charAt(cursor) !== ' ')) {
				return false;
			}

			const [suggestion, fragmentLength] = this.getSuggestion(cursor, text);
			if (suggestion) {
				textComponent.setValue(text + suggestion.slice(fragmentLength));
				textComponent.inputEl.setSelectionRange(text.length, textComponent.getValue().length);
				return true;
			}
			return false;
		})();

		// reset suggestions
		if (!res) {
			this.filteredSuggestions = null;
		}

		return res;
	}

	private getSuggestion(cursor: number, text: string): [string | null, number] {
		const selectedWord = this.getSelectedWord(cursor, text);
		const fragment = selectedWord.slice(1);
		if (!fragment) {
			this.prevSelectedWord = selectedWord;
			return [null, 0];
		}

		if (selectedWord.startsWith(this.prevSelectedWord) && this.filteredSuggestions) {
			this.filteredSuggestions = this.filteredSuggestions.filter((sug) => sug.startsWith(fragment));
		} else {
			this.filteredSuggestions = null;
			for (const [prefix, options] of this.prefixToSuggestionOptions.entries()) {
				if (selectedWord.startsWith(prefix)) {
					this.filteredSuggestions = options.filter((opt) => opt.startsWith(fragment));
					this.filteredSuggestions.sort();
					break;
				}
			}
		}
		this.prevSelectedWord = selectedWord;

		if (this.filteredSuggestions && this.filteredSuggestions.length) {
			return [this.filteredSuggestions[0], fragment.length];
		}

		return [null, 0];
	}

	private getSelectedWord(endPosition: number, text: string): string {
		const reversedChars = [];
		let currPosition = endPosition;
		while (currPosition > -1 && text.charAt(currPosition) !== ' ') {
			reversedChars.push(text.charAt(currPosition--));
		}

		return reversedChars.reverse().join('');
	}
}
