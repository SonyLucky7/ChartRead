import { loggerService } from '../../logger';
import { userService } from '.';

export const proFeature = (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
	return featureRequester(descriptor, () => userService().getCurrentUser().isPro);
};

export const authenticatedFeature = (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
	return featureRequester(descriptor, () => userService().getCurrentUser().isAuthenticated);
};

type FeatureCondition = () => boolean;

const featureRequester = (descriptor: PropertyDescriptor, featureCondition: FeatureCondition): PropertyDescriptor => {
	const func = descriptor.value as unknown;

	descriptor.value = function(...args: unknown[]) {
		if (typeof func === 'function' && featureCondition()) {
			loggerService().debug('featureRequester(): "Feature access granted"');
			return func.apply(this, args) as unknown;
		}

		return userService().requestProFeature();
	};

	return descriptor;
};
