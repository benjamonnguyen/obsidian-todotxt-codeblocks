import { App, Modal, Setting } from "obsidian";

export default class EditModal extends Modal {
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
        
        new Setting(contentEl)
        .addButton((btn) =>
        btn
        .setButtonText("Edit")
        .setCta()
        .onClick(() => {
            this.close();
            this.onSubmit(this.result);
        }));
    }
    
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}