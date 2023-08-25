export default interface ViewModel {
	render(): Element;
	getId(): string | undefined;
	getHtmlCls(): string;
}
