export function closeAlertPopupHelper(): void {
	const isSingleDialog = document.querySelectorAll('div[class*=dialog--single]').length > 0;
	if (!isSingleDialog) {
		return;
	}
	const closePopupElement = document.querySelectorAll('[data-name=close]')[0] as HTMLElement;
	if (closePopupElement) {
		closePopupElement.click();
	}
}
