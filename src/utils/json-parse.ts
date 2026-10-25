import { checkedLoggerService } from '../logger';

type Reviver = (this: any, key: string, value: any) => any;

export const jsonParse = <T>(text: string, reviver?: Reviver): T | null => {
	try {
		return JSON.parse(text, reviver) as T;
	}
	catch (error) {
		checkedLoggerService().error('jsonParse JSON.parse error', error);
		return null;
	}
};

export const safeJsonParse = <T>(guard: (o: any) => o is T) => (text: string, reviver?: Reviver): T | null => {
	const parsed = jsonParse(text, reviver);
	if (guard(parsed)) {
		return parsed;
	}

	checkedLoggerService().error(`safeJsonParse parsed to wrong type json - ${ text }`);
	return null;
};
