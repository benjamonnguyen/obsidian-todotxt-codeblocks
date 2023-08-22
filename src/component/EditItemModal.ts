import { App, ButtonComponent, Modal, Setting } from "obsidian";

export default class EditItemModal extends Modal {

    static ID = "edit-item-modal";

    result: string;
    onSubmit: (result: string) => void;
    
    constructor(app: App, originalText: string, onSubmit: (result: string) => void) {
        super(app);
        this.result = originalText;
        this.onSubmit = onSubmit;
    }
    
    onOpen() {
        const { contentEl } = this;
        
        const input = new Setting(contentEl)
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

        input.addText((text) => {
            text.setValue(this.result);
            text.onChange((value) => {
                submit.components.find(component => component instanceof ButtonComponent)?.setDisabled(!value);
                this.result = value
            });
        });
    }
    
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
