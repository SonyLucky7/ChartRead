import React from 'react';
import { withTranslation } from 'react-i18next';

import DialogWindow from './dialog-window';

const DialogWindowTranslation = withTranslation()(DialogWindow);

export function DialogWindowContainer(): JSX.Element {
	return <DialogWindowTranslation />;
}
