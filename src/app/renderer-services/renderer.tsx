import React, { ComponentPropsWithRef, LazyExoticComponent } from 'react';

import { loggerServiceProxy } from '../../logger';

export type ComponentRenderer<RendererProps> = (props: RendererProps) => JSX.Element;
export class ContentRenderer<RendererType, RendererProps> {
	private renderers = new Map<RendererType, ComponentRenderer<RendererProps>>();

	registerLazyRenderer<T extends React.ComponentType<any>>(type: RendererType, component: LazyExoticComponent<T>): void {
		const renderer: ComponentRenderer<RendererProps> = (props: RendererProps) => {
			// React requires capitalized component referense
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const Component = component;

			return <Component { ...(props as unknown as ComponentPropsWithRef<T>) } />;
		};

		this.renderers.set(type, renderer);
	}

	getRenderer(type: RendererType): ComponentRenderer<RendererProps> | undefined {
		const renderer = this.renderers.get(type);

		if (!renderer) {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			loggerServiceProxy().error(`Renderer for type ${ type } not registered, check renderers configuration`);
		}

		return renderer;
	}
}
