import {
	AbstractTextComponent,
	App,
	DropdownComponent,
	TextAreaComponent,
	TextComponent,
} from 'obsidian';
import EditItemModal from './EditItemModal';
import { SETTINGS_READ_ONLY } from 'src/main';
import { TodoList, TodoItem } from 'src/model';

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

	constructor(app: App, todoList: TodoList, onSubmit: (result: TodoItem) => void) {
		super(app, '', todoList, onSubmit);
	}

	onOpen() {
		super.onOpen();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const textComponent = this.input.components.find(
			(comp) => comp instanceof TextComponent || comp instanceof TextAreaComponent,
		)! as AbstractTextComponent<HTMLInputElement | HTMLTextAreaElement>;
		textComponent.setPlaceholder(
			AddItemModal.placeholders[Math.floor(Math.random() * AddItemModal.placeholders.length)],
		);

		const priorityDropDown = this.input.components.find(
			(comp) => comp instanceof DropdownComponent,
		) as DropdownComponent;
		if (priorityDropDown) {
			priorityDropDown.setValue(SETTINGS_READ_ONLY.defaultPriority);
			this.item.setPriority(
				priorityDropDown.getValue() !== 'none' ? priorityDropDown.getValue() : null,
			);
			this.handlePriorityStyle(this.item.priority(), priorityDropDown);
		}
	}

	getSubmitButtonText(): string {
		return 'Add';
	}
}
