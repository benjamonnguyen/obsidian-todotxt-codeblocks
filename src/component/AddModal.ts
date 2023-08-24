import { AbstractTextComponent, App, ButtonComponent, Modal, Setting } from "obsidian";

export default class AddModal extends Modal {

    static ID = "add-modal"
    static placeholders = [
        "(B) Call Mom @Phone +Family rec:1m",
        "(C) Schedule annual checkup +Health due:1yM",
        "Pick up milk +Groceries due:Sa",
        "Tend to herb @garden +Home rec:1w2d",
        "(A) Fix parsing @bug +obsidian-todotxt-codeblocks due:0",
        "Ship new @feature +obsidian-todotxt-codeblocks due:2040-08-06",
    ];

    result: string;
    onSubmit: (result: string) => void;
    
    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }
    
    onOpen() {
        const { contentEl } = this;
        
        const input = new Setting(contentEl);
        input.settingEl.addClasses([
            "todotxt-modal-input-begin",
            "todotxt-modal-input",
            "todotxt-modal-input-full",
        ]);
        
        const submit = new Setting(contentEl)
            .addButton((btn) =>
                btn
                .setButtonText("Add")
                .setDisabled(true)
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(this.result);
                })
            );
        submit.settingEl.addClass("todotxt-modal-btn", "todotxt-modal-submit");

        const handleText = (text: AbstractTextComponent<any>) => {
            text.setPlaceholder(AddModal.placeholders[(Math.floor(Math.random() * AddModal.placeholders.length))]);
            text.onChange((value) => {
                submit.components.find(component => component instanceof ButtonComponent)?.setDisabled(!value);
                this.result = value
            });
        }
        // @ts-ignore
        if (this.app.isMobile) {
            input.addTextArea(handleText);
        } else {
            input.addText(handleText);
        }
    }
    
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
