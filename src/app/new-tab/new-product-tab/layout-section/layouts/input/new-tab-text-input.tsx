import React from 'react';
import { useTranslation } from 'react-i18next';
import { ControlSize } from '@tradingview/ui-lib/controls/control-skeleton/types';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIconsearchSize28pxStroke1pxTypeSearch as searchSvgIcon } from '@tradingview/ui-lib/icons/monochrome/search/size_28px__stroke_1px__type_search';

import { TextInput } from '../../../../../components-ui/text-input';

import './new-tab-text-input.css';

interface NewTabTextInputProps {
	value: string;
	onChange(ev: React.ChangeEvent<HTMLInputElement>): void;
	inputRef?: React.RefObject<HTMLInputElement>;
	onBlur?(): void;
	onClear?(): void;
	onFocus?(): void;
}

export const NewTabTextInput = (props: NewTabTextInputProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<TextInput
			{ ...props }
			allowClear
			className='new-tab-search-text-input'
			maxLength={ 64 }
			name='new-product-tab-input'
			placeholder={ t('Search') }
			startSlot={ <BlockIcon icon={ searchSvgIcon } className='new-tab-search-text-input-icon' /> }
			size={ ControlSize.Medium }
		/>
	);
};
