import React, { Suspense } from 'react';

import { NewProductTab } from './new-product-tab';

export function NewTabTransContainer(): JSX.Element {
	return (
		<Suspense fallback={ <></> }>
			<NewProductTab />
		</Suspense>
	);
}
