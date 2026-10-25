import React from 'react';
import { BadgeSize } from '@tradingview/ui-lib/badge';
import { BadgeSlashSoftWithText } from '@tradingview/ui-lib/badges/badge-slash-soft-with-text/badge-slash-soft-with-text';

import { UserPlanBadgeName } from '../../../../services/user/user';

import './badge-user.css';

interface BadgeUserProps {
	userPlanBadgeName: UserPlanBadgeName;
}

function isTrial(userPlanBadgeName: UserPlanBadgeName): boolean {
	return userPlanBadgeName.includes('_trial');
}

// Pro badge name taken from: https://git.xtools.tv/frontend/tradingview/-/blob/master/static/ui-kit/badge-user-slash-soft/badge-user-slash-soft.tsx?ref_type=heads#L56
function getUserBadgeText(userPlanBadgeName: UserPlanBadgeName): string {
	switch (userPlanBadgeName) {
		case 'pro:pro_expert': {
			return 'Expert';
		}

		case 'pro:pro_premium_expert': {
			return 'Ultimate';
		}

		case 'pro:pro_premium':
		case 'pro:pro_premium_trial': {
			return 'Premium';
		}

		case 'pro:pro_realtime':
		case 'pro:pro_realtime_trial': {
			return 'Plus';
		}

		case 'pro:pro':
		case 'pro:pro_trial': {
			return 'Essential';
		}

		default: return '';
	}
}

export const BadgeUser = ({ userPlanBadgeName }: BadgeUserProps): JSX.Element => {
	const userBadgeText = getUserBadgeText(userPlanBadgeName);

	return userBadgeText
		? <BadgeSlashSoftWithText className={ isTrial(userPlanBadgeName) ? 'trial' : '' } size={ BadgeSize.XSmall }> { userBadgeText } </BadgeSlashSoftWithText>
		: <></>;
};
