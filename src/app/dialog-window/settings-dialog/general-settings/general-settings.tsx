import React from 'react';

import { AutofillSection } from './autofill-section';
import { FileDownloadSection } from './file-download-section';
import { ThemeSection } from './theme-section';

export const GeneralSettings = (): JSX.Element =>
	<>
		<AutofillSection />
		<ThemeSection />
		<FileDownloadSection />
	</>;
