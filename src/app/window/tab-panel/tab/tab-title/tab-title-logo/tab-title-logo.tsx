import React, { Dispatch, SetStateAction, useState } from 'react';

import './tab-title-logo.css';

interface TabTitleLogoProps {
	symbol: string;
	sources: string[];
	last: string;
}

interface ErrorProps {
	onError: Dispatch<SetStateAction<boolean>>;
}

interface SingleImageProps extends ErrorProps {
	source: string;
}

interface SeveralImagesProps extends ErrorProps {
	sources: string[];
}

const EmptyLogo = ({ symbol }: Pick<TabTitleLogoProps, 'symbol' >): JSX.Element =>
	<span className='empty-logo'>
		<div className='empty-logo-symbol'>
			{ symbol }
		</div>
	</span>;

const SingleImage = ({ source, onError }: SingleImageProps): JSX.Element =>
	<div className='logo-image-container single'>
		<img
			className='logo-image main-symbol-image'
			onError={ () => onError(true) }
			src={ source }
		/>
	</div>;

const SeveralImages = ({ sources, onError }: SeveralImagesProps): JSX.Element =>
	<div className='logo-image-container pair'>
		<img
			className='logo-image first-symbol-image '
			onError={ () => onError(true) }
			src={ sources[0] }
		/>
		<img
			className='logo-image second-symbol-image '
			onError={ () => onError(true) }
			src={ sources[1] }
		/>
	</div>;

export const TabTitleLogo = ({ symbol, sources, last }: TabTitleLogoProps): JSX.Element => {
	const [isLogoURLInvalid, setIsLogoURLInvalid] = useState(false);

	if (last.length === 0) {
		return <EmptyLogo symbol='' />;
	}

	if ((isLogoURLInvalid || sources.length === 0) && last.length > 0) {
		return <EmptyLogo symbol={ symbol[0] } />;
	}

	if (sources.length === 1) {
		return <SingleImage source={ sources[0] } onError={ setIsLogoURLInvalid }/>;
	}

	return <SeveralImages sources={ sources } onError={ setIsLogoURLInvalid } />;
};
