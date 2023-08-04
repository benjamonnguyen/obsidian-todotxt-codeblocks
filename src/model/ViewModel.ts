interface ViewModel {
    render(): HTMLElement;
    toString(): string;
    getId(): string;
    getHtmlCls(): string;
}