export default interface ViewModel {
	render(): Element;
	get id(): string | null;
	get htmlCls(): string;
}
