import '../../services/locale/i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorViewTransContainer } from './error-view-container';

import '../../index.css';

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<ErrorViewTransContainer />);
}
