import { App, ComponentOptions } from "vue";
import { VueBase, VueConstructor } from "vue-class-component";


export const knownComponents: Record<string, VueConstructor<VueBase>> = {};


export function registerKnownComponents(app: App<Element>): typeof app {
	for (let k in knownComponents) {
		app.component(k, knownComponents[k]);
	}
	return app;
}

export function Component<V extends VueConstructor>(options?: ComponentOptions & ThisType<V>):
	<VC extends VueConstructor<VueBase>>(target: VC) => VC;
export function Component<VC extends VueConstructor<VueBase>>(target: VC): VC;
export function Component<V extends VueConstructor, VC extends VueConstructor<VueBase>>
	(options: ComponentOptions & ThisType<V> | VC = {}) {
	function convert<VC extends VueConstructor<VueBase>>(target: VC): VC {
		let comp = target as VC & { __o: ComponentOptions & ThisType<V>, __d?: any[] }
		comp.__o = Object.assign(comp.__o || {}, options);
		comp.__o.name ??= target.name;
		// comp.__o.__sauce = comp;
		knownComponents[comp.__o.name] = comp;
		return comp;
	}
	if (typeof options == 'function') {
		let target = options;
		options = {};
		return convert(target);
	} else {
		return convert;
	}
};

export const known = {
	install(app: App) {
		registerKnownComponents(app);
		return app;
	}
}

export const custom = {
	install(app: App) {
		app.config.compilerOptions.isCustomElement = (tag) => {
			return tag.toUpperCase() == tag;
		}
		return app;
	}
}