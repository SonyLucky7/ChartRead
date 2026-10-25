import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@tradingview/ui-lib/typography';

import { DialogProps, OptionsDialogData } from '../../../services/window/window-api';

import './options-dialog.css';

export const OptionsDialog = ({ data, inputChange }: DialogProps<OptionsDialogData>): JSX.Element => {
	const { i18n } = useTranslation();

	const [selectedOption, setSelectedOption] = useState<number>(0);

	useEffect(() => {
		inputChange({ options: [data.options[0]] });
	/**
	 * we use here no dependencies to prevent excessive rerenders
	 */
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const selectOption = (option: number): void => {
		console.log(`Selected option ${ option } name: ${ data.options[option].name }`);

		setSelectedOption(option);

		inputChange({ options: [data.options[option]] });
	};

	return (
		<div className={ `dialog-options ${ i18n.language }` }>
			{ data.options.map(({ data: optionData, name }, index) =>
				<button
					key={ name }
					className={ `option ${ selectedOption === index ? 'selected' : '' }` }
					onClick={ () => selectOption(index) }
					tabIndex={ -1 }
				>
					<img className="option-thumbnail" src={ String(optionData) } alt={ name } />
					<Typography
						tag='caption'
						name='typography-accent-16px-medium'
						className='option-caption'
					>
						{ name }
					</Typography>
				</button>
			) }
		</div>
	);
};
