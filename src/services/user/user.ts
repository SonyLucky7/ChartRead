import {
	CLAIM_PLAN,
	CLAIM_PRO,
	CLAIM_PRO_BADGE_NAME,
	CLAIM_USER_ID,
	CLAIM_USER_NAME,
	CLAIM_USER_PIC,
	ClaimsContainer,
	findClaim,
	hasClaim,
	hasNonEmptyClaim,
} from './claims';

type ProBadgeName =
	| 'pro:pro_premium_expert'
	| 'pro:pro_expert'
	| 'pro:pro_premium'
	| 'pro:pro_premium_trial'
	| 'pro:pro_realtime'
	| 'pro:pro_realtime_trial'
	| 'pro:pro'
	| 'pro:pro_trial'
;

export type UserPlanBadgeName = ProBadgeName | 'free'

export class User {
	readonly claims: ClaimsContainer;
	readonly session: Electron.Cookie | undefined;

	constructor(claims: ClaimsContainer, session?: Electron.Cookie) {
		this.claims = claims;
		this.session = session;
	}

	get id(): string {
		return this.getClaim(CLAIM_USER_ID, '') as string;
	}

	get username(): string {
		return this.getClaim(CLAIM_USER_NAME, this.id) as string;
	}

	get isAuthenticated(): boolean {
		return hasNonEmptyClaim(this.claims, CLAIM_USER_ID);
	}

	get isAnonymous(): boolean {
		return !this.isAuthenticated;
	}

	get userpic(): string {
		return this.getClaim(CLAIM_USER_PIC, '') as string;
	}

	get isPro(): boolean {
		return !!this.getClaim(CLAIM_PRO, '');
	}

	get plan(): string {
		return this.getClaim(CLAIM_PLAN, '') as string;
	}

	get userPlanBadgeName(): UserPlanBadgeName {
		return this.getClaim<ProBadgeName>(CLAIM_PRO_BADGE_NAME) ?? 'free';
	}

	// TODO need to refactor collection of claims
	getClaim<ClaimType = string | number | boolean>(type: string, defaultValue?: ClaimType): ClaimType | undefined {
		const claim = findClaim(this.claims, type);

		return (claim?.value as ClaimType) ?? defaultValue;
	}

	hasClaim(type: string, value?: unknown): boolean {
		return hasClaim(this.claims, type, value);
	}
}
