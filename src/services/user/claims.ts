import { isAnonymous, TVAnonymous, TVUser } from '../../tv-api';

export const CLAIM_USER_ID = 'user:id';
export const CLAIM_USER_NAME = 'user:username';
export const CLAIM_USER_PIC = 'user:pic';
export const CLAIM_THEME = 'user:theme';
export const CLAIM_LAST_LOCALE = 'user:last_locale';
export const CLAIM_PRO = 'user:pro';
export const CLAIM_PLAN = 'user:plan';
export const CLAIM_PRO_BADGE_NAME = 'user:pro_badge_name';
export const CLAIM_FIRSTTIME_INITIALIZATION = 'internal__:firsttime-initialization';

export interface Claim {
	type: string;
	value: number | string | boolean;
}

export type ClaimsContainer = Array<Claim>;

export function findClaim(claims: ClaimsContainer, type: string): Claim | undefined {
	return claims.find(c => c.type === type);
}

export function hasNonEmptyClaim(claims: ClaimsContainer, type: string): boolean {
	const claim = findClaim(claims, type);
	return typeof claim?.value !== 'undefined';
}

export function hasClaim(claims: ClaimsContainer, type: string, value?: unknown): boolean {
	const claim = claims.find(c => c.type === type);
	if (typeof claim === 'undefined') {
		return false;
	}

	return typeof value === 'undefined' || claim.value === value;
}

export function makeUserClaims(user: TVUser | TVAnonymous): ClaimsContainer {
	const claims: ClaimsContainer = [];
	if (!isAnonymous(user)) {
		claims.push({ type: CLAIM_USER_ID, value: user.id });
		claims.push({ type: CLAIM_USER_NAME, value: user.username });
		claims.push({ type: CLAIM_THEME, value: user.theme });
		claims.push({ type: CLAIM_USER_PIC, value: user.avatars.small });
		claims.push({ type: CLAIM_PLAN, value: user.pro_plan === '' ? 'basic' : user.pro_plan });

		const badges = user.badges;
		if (badges && badges.length > 0) {
			const proBadge = badges.find(({ name }) => name.startsWith('pro'));
			if (proBadge) {
				claims.push({ type: CLAIM_PRO_BADGE_NAME, value: proBadge.name });
			}
		}

		const isPro = user.pro_plan !== '';

		if (isPro) {
			claims.push({ type: CLAIM_PRO, value: true });
		}

		if (user.last_locale) {
			claims.push({ type: CLAIM_LAST_LOCALE, value: user.last_locale });
		}
	}

	return claims;
}
