import React, { useEffect } from 'react';

interface RendererComponentWrapperProps {
	onUnmount?(): void;
	fallbackComponent?: JSX.Element;
}

export function RendererSuspenseFallback({ onUnmount, fallbackComponent }: RendererComponentWrapperProps): JSX.Element {
	useEffect(() => {
		if (!onUnmount) {
			return;
		}

		return () => onUnmount();
	}, []);

	return (
		fallbackComponent ?? <React.Fragment/>
	);
}
