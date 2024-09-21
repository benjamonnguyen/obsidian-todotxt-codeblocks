import {
	AbstractTextComponent,
	DropdownComponent,
	TextAreaComponent,
	TextComponent,
} from 'obsidian';
import EditItemModal from './EditItemModal';
import { TodoItem } from 'src/model';

export default class AddItemModal extends EditItemModal {
	static ID = 'todotxt-add-item-modal';
	static placeholders = [
		'Call Mom @Phone +Family rec:1m',
		'Schedule annual checkup +Health due:M1y',
		'Pick up milk +Groceries due:Sa',
		'Tend to herb @garden +Home rec:1w2d',
		'Fix parsing @bug +obsidian-todotxt-codeblocks due:0',
		'Ship new @feature +obsidian-todotxt-codeblocks due:2040-08-06',
	];

	constructor(el: Element,
		onSubmit: (result: TodoItem) => void) {
		super('', el, onSubmit);
	}

	onOpen() {
		super.onOpen();
		const priorityDropDown = this.input.components.find(
			(comp) => comp instanceof DropdownComponent,
		) as DropdownComponent;

		const textComponent = this.input.components.find(
			(comp) => comp instanceof TextComponent || comp instanceof TextAreaComponent,
		)! as AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>;
		if (textComponent) {
			textComponent.setPlaceholder(
				AddItemModal.placeholders[Math.floor(Math.random() * AddItemModal.placeholders.length)],
			);
		}
	}

	getSubmitButtonText(): string {
		return 'Add';
	}
}
