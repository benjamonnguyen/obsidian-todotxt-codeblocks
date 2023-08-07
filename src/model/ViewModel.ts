export default interface ViewModel {
    render(): HTMLElement;
    getId(): string | undefined;
    getHtmlCls(): string;
}