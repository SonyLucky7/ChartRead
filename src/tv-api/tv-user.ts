/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable camelcase */

export interface TVUserSettings {
	[key: string]: any;
}

export interface TVUser {
	id: number;
	avatars: {
		small: string;
	};
	pro_plan: string;
	settings: TVUserSettings;
	theme: string;
	username: string;
	userpic: string;
	userpic_big: string;
	badges?: { name: string; }[];
	is_pro?: boolean;
	is_pro_limited?: boolean;
	last_locale?: string;
}

export interface TVAnonymous {
	id: undefined;
}

export function isAnonymous(usr: TVUser | TVAnonymous): usr is TVAnonymous {
	return typeof usr.id === 'undefined';
}
