import { TFunction } from 'i18next';
import React, { Component } from 'react';
import { Subscription } from 'rxjs';
import { Typography } from '@tradingview/ui-lib/typography';

import { settingsProviderProxy } from '../../../../../services/settings';
import { TabTitleId, TabTitleState } from '../../../../../services/settings/tab-title-interfaces';
import { TabTitleView, TabTitleViewType } from '../../../../../services/window/window-api';
import { RendererData } from '../../../../../tv-api';
import { DelimiterPosition, delimiterPosition } from '../../../../common/delimiter-position';
import { tabFavicons } from '../../tab-utils';
import { TabTitleLogo } from './tab-title-logo';

import './tab-title.css';

interface TabTitleProps {
	t: TFunction;
	title: TabTitleView;
	isLogoVisible: boolean;
	active?: boolean;
	faviconKey?: string;
	isTooltip?: boolean;
}

interface State {
	tabSettingsState?: TabTitleState[];
}

export class TabTitle extends Component<TabTitleProps, State> {
	public override state: State = {
		tabSettingsState: [],
	};

	private tabSettingsStateSubscription?: Subscription;

	private titleElements = new Map<TabTitleId, ((titleData: RendererData, delimiterPosition: DelimiterPosition) => JSX.Element)>([
		['symbolLogo', (titleData) => this.renderLogo(titleData)],
		['ticker', (titleData) => this.renderTicker(titleData)],
		['priceChangeIcon', (titleData) => this.renderChangeIcon(titleData)],
		['lastPrice', (titleData) => this.renderLastPrice(titleData)],
		['priceChange', (titleData) => this.renderPriceChange(titleData)],
		['layoutName', (titleData, delimiter) => this.renderLayoutName(titleData, delimiter)],
	]);

	public override componentDidMount(): void {
		this.tabSettingsStateSubscription = settingsProviderProxy().tabChange.subscribe((value) => {
			this.setState({ tabSettingsState: value.filter(tab => tab.isVisible) });
		});
	}

	public override componentWillUnmount(): void {
		this.tabSettingsStateSubscription?.unsubscribe();
	}

	public override render(): JSX.Element {
		const { title } = this.props;

		if (title.type === TabTitleViewType.Basic) {
			return this.renderTitle(
				title.title,
				title.faviconKey
			);
		}

		const { tabSettingsState } = this.state;
		if (!tabSettingsState) {
			return <></>;
		}

		const hasOnlyEmptyLayoutPart = tabSettingsState.length === 1 && tabSettingsState[0].id === 'layoutName' && !title.name;

		if (tabSettingsState.length === 0 || hasOnlyEmptyLayoutPart) {
			return <span>{ this.props.t('Tab title') }</span>;
		}

		return (
			<div className={ this.props.isTooltip ? 'tooltip-container' : 'title-container' }>
				{ tabSettingsState.map((tab): JSX.Element => {
					const renderElement = this.titleElements.get(tab.id as TabTitleId);
					if (!renderElement) {
						return <></>;
					}

					return renderElement(title, delimiterPosition(tabSettingsState));
				}) }
			</div>
		);
	}

	private getChangeColorClassName(changeSign: number): string {
		if (changeSign === 0) {
			return '';
		}
		return changeSign > 0 ? 'uptrend' : 'downtrend';
	}

	private getStringChangeSign(changeSign: number): string {
		if (changeSign === 0) {
			return '';
		}

		return changeSign > 0 ? '\u25B2 ' : '\u25BC ';
	}

	private renderTitle(title: string, faviconKey?: string): JSX.Element {
		const { isLogoVisible, isTooltip } = this.props;

		const faviconSource = faviconKey ? tabFavicons.get(faviconKey) : undefined;

		return (
			<div className={ isTooltip ? 'tooltip-container' : 'title-container' }>
				{ isLogoVisible && faviconSource &&
					<div className='logo-image-container single'>
						{ React.createElement(faviconSource) }
					</div>
				}

				<Typography
					tag='span'
					name='typography-accent-13px-semibold'
					className='title'
				>
					{ title }
				</Typography>
			</div>
		);
	}

	private renderLogo = (title: RendererData | string): JSX.Element => {
		const { isLogoVisible } = this.props;

		if (!isLogoVisible || typeof title === 'string') {
			return <React.Fragment key='noLogo'/>;
		}

		return (
			<TabTitleLogo
				key='logo'
				last={ title.last ?? '' }
				sources={ title.logoUrls?.length ? title.logoUrls : [] }
				symbol={ title.symbol ?? '' }
			/>
		);
	};

	private renderTicker({ symbol }: RendererData): JSX.Element {
		return (
			<Typography
				key='symbol'
				tag='span'
				name='typography-accent-13px-semibold'
				className='symbol'
			>
				{ symbol }
			</Typography>
		);
	}

	private renderChangeIcon({ changeSign }: RendererData): JSX.Element {
		if (!changeSign) {
			return <React.Fragment key='change-icon' />;
		}

		return (
			<span
				key='change-icon'
				className={ `change-icon ${ this.getChangeColorClassName(changeSign) }` }
			>
				{ this.getStringChangeSign(changeSign) }
			</span>
		);
	}

	private renderLastPrice({ last: lastPrice }: RendererData): JSX.Element {
		if (!lastPrice) {
			return <React.Fragment key='last-price' />;
		}

		return (
			<Typography
				key='last-price'
				tag='span'
				name='typography-regular-13px'
				className='last-price'
			>
				{ lastPrice }
			</Typography>
		);
	}

	private renderPriceChange({ changeSign, changePercent }: RendererData): JSX.Element {
		if (!changePercent) {
			return <React.Fragment key='price-change' />;
		}

		return (
			<Typography
				key='price-change'
				tag='span'
				name='typography-accent-13px-semibold'
				className={ `price-change ${ this.getChangeColorClassName(changeSign) }` }
			>
				{ changePercent }
			</Typography>
		);
	}

	private renderLayoutName({ name }: RendererData, delimiter: DelimiterPosition): JSX.Element {
		if (!name) {
			return <React.Fragment key='layout-name' />;
		}

		const startDelimiter = delimiter.before ? '/ ' : '';
		const endDelimiter = delimiter.after ? ' /' : '';

		return (
			<Typography
				key='layout-name'
				tag='span'
				name='typography-regular-13px'
				className='layout-name'
			>
				{ startDelimiter }{ name }{ endDelimiter }
			</Typography>
		);
	}
}
