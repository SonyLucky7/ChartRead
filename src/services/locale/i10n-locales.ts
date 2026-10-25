interface LangCode {
	regex: RegExp;
	code: string;
}

// locales from https://source.chromium.org/chromium/chromium/src/+/main:ui/base/l10n/l10n_util.cc

export const l10nToi18nMap: LangCode[] = [
	{ regex: /ar((-)?([a-z]{2})?)?$/, code: 'ar_AE' },
	{ regex: /de((-)?([a-z]{2})?)?$/, code: 'de_DE' },
	{ regex: /en-in/, code: 'en_IN' },
	{ regex: /en(-([a-z]){2}(-([a-z])+)?)?$/, code: 'en' },
	{ regex: /es((-)?(([a-z]{2})|([0-9]{3}))?)?$/, code: 'es' },
	{ regex: /fr((-)?([a-z]{2})?)?$/, code: 'fr' },
	{ regex: /he/, code: 'he_IL' },
	{ regex: /id/, code: 'id' },
	{ regex: /it((-)?([a-z]{2})?)?$/, code: 'it' },
	{ regex: /ja/, code: 'ja' },
	{ regex: /ko/, code: 'kr' },
	{ regex: /ms/, code: 'ms_MY' },
	{ regex: /pl/, code: 'pl' },
	{ regex: /pt((-)?([a-z]{2})?)?$/, code: 'br' },
	{ regex: /ru/, code: 'ru' },
	{ regex: /th/, code: 'th_TH' },
	{ regex: /tr/, code: 'tr' },
	{ regex: /vi/, code: 'vi_VN' },
	{ regex: /zh(-(cn|hk))?$/, code: 'zh_CN' },
	{ regex: /zh-tw/, code: 'zh_TW' },
];
