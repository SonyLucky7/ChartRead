import React from 'react';
import { Badge, BadgeSize } from '@tradingview/ui-lib/badge';
import { Typography } from '@tradingview/ui-lib/typography';

import { preventScrollOnMiddleClick } from '../../../new-product-tab';
import { HandleProductContextMenuClickOptions } from '../products';

import './product.css';

interface ProductProps {
	id: string;
	onClick(ev: React.MouseEvent<HTMLLIElement>, urlPathname: string): void;
	onContextMenu(ev: React.MouseEvent<HTMLLIElement>, options: HandleProductContextMenuClickOptions): void;
	title: string | [string, string];
	urlPathname: string;
	isBeta: boolean;
	isNew: boolean;
}

export const Product = ({ id, onClick, onContextMenu, title, urlPathname, isBeta, isNew }: ProductProps): JSX.Element =>
	<li
		onClick={ (ev) => { onClick(ev, urlPathname); } }
		onAuxClick={ (ev) => { onClick(ev, urlPathname); } }
		onMouseDown={ preventScrollOnMiddleClick }
		onContextMenu={ (ev) => { onContextMenu(ev, { title, urlPathname }); } }
		className={ `product-customizable ${ id }` }
	>
		<div className='product-customizable-image' />
		<div className='product-customizable-title-container'>
			<Typography
				tag='div'
				name='typography-accent-16px-medium'
				className='product-customizable-title'
			>
				{ Array.isArray(title)
					? <>
						<span className='product-customizable-title-part'>{ title[0] }</span>
						<span className='product-customizable-title-separator' />
						<span className='product-customizable-title-part'>{ title[1] }</span>
					</>
					: <span className='product-customizable-title-part'>{ title }</span>
				}
			</Typography>
			{ isBeta && <Badge size={ BadgeSize.Small }>beta</Badge> }
			{ isNew && <Badge size={ BadgeSize.Small } className='product-customizable-badge new'>new</Badge> }
		</div>
	</li>;
