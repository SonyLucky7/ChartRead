import React from 'react';
import { useTranslation } from 'react-i18next';
import { CircleLogo } from '@tradingview/ui-lib/circle-logo';
import { CircleLogoSize } from '@tradingview/ui-lib/circle-logo/types';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../logger';
import { mainMenuServiceProxy } from '../../../services/main-menu-service';
import { UserData } from '../../../services/window/menu-window-types';
import { BadgeUser } from './badge-user';

import AnonymousAvatar from './assets/user-outline.svg';

import './user-card.css';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UserCardProps extends UserData {}

export const UserCard = ({ name, avatar, isAnonymous, isPro, userPlanBadgeName }: UserCardProps): JSX.Element => {
	const { t } = useTranslation();

	const handleProfileClick = (): void => {
		mainMenuServiceProxy().openUserPage(name)
			.catch((error) => {
				loggerServiceProxy().error(
					`<UserCard>.onProfileClick(): mainMenuServiceProxy().openUserPage(name: ${ name }) error`,
					error
				);
			});
	};

	const handleSignIn = (): void => {
		mainMenuServiceProxy().signIn()
			.catch((error) => {
				loggerServiceProxy().error('<UserCard>.onSignIn(): mainMenuServiceProxy().signIn() error', error);
			});
	};

	return (
		<section className='user-card-container'>
			<button className='user-card' onClick={ isAnonymous ? handleSignIn : handleProfileClick } tabIndex={ -1 }>
				{ isAnonymous
					? <>
						<div className='user-card-avatar-container' >
							<AnonymousAvatar />
						</div>
						<Typography tag='div' name='typography-accent-14px-semibold'>{ t('Sign in') }</Typography>
					</>
					: <>
						<CircleLogo logoUrl={ avatar } size={ CircleLogoSize.Medium } />
						<div className='user-name'>
							<Typography tag='span' name='typography-accent-14px-semibold'>{ name }</Typography>
							{ isPro && <BadgeUser userPlanBadgeName={ userPlanBadgeName } /> }
						</div>
					</>
				}
			</button>
		</section>
	);
};
