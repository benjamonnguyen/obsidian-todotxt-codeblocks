import { App, Modal, Setting } from "obsidian";

export default class EditItemModal extends Modal {

    static ID = "edit-item-modal";

    result: string;
    originalText: string;
    onSubmit: (result: string) => void;
    
    constructor(app: App, originalText: string, onSubmit: (result: string) => void) {
        super(app);
        this.originalText = originalText;
        this.onSubmit = onSubmit;
    }
    
    onOpen() {
        const { contentEl } = this;
        
        const input = new Setting(contentEl)
        .addText((text) => {
            text.setValue(this.originalText);
            text.onChange((value) => {
                this.result = value
            });
        });
        input.settingEl.addClasses([
            "todotxt-modal-input-begin",
            "todotxt-modal-input",
            "todotxt-modal-input-full",
        ]);
        
        const submit = new Setting(contentEl)
        .addButton((btn) =>
        btn
        .setButtonText("Edit")
        .setCta()
        .onClick(() => {
            this.close();
            this.onSubmit(this.result);
        }));
        submit.settingEl.addClass("todotxt-modal-submit");
    }
    
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
