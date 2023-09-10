import EditItemModal from './EditItemModal';

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

	onOpen() {
		super.onOpen();
		this.textComponent.setPlaceholder(
			AddItemModal.placeholders[Math.floor(Math.random() * AddItemModal.placeholders.length)],
		);
	}

	getSubmitButtonText(): string {
		return 'Add';
	}
}
