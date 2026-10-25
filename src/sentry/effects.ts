type Effect = () => void;

export let registeredEffects: Array<Effect> = [];

export function registerSentryEffect(effect: Effect): () => void {
	registeredEffects.push(effect);
	return () => {
		registeredEffects = registeredEffects.filter((regEffect) => regEffect !== effect);
	};
}
