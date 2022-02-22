import { App, ComponentOptions } from "vue";
import { VueBase, VueConstructor } from "vue-class-component";
import { convertTemplate } from "./template";


export const globalComponents: Record<string, VueConstructor<VueBase>> = {};

export function GlobalComponent<V extends VueConstructor>(options?: ComponentOptions & ThisType<V>):
	<VC extends VueConstructor<VueBase>>(target: VC) => VC;
export function GlobalComponent<VC extends VueConstructor<VueBase>>(target: VC): VC;
export function GlobalComponent<V extends VueConstructor, VC extends VueConstructor<VueBase>>
	(options: ComponentOptions & ThisType<V> | VC = {}) {
	function convert<VC extends VueConstructor<VueBase>>(target: VC): VC {

		let comp = target as VC & { __o: ComponentOptions & ThisType<V>, __d?: any[] }
		comp.__o = Object.assign(comp.__o || {}, options);
		comp.__o.name ??= target.name;
		// comp.__o.__sauce = comp;
		globalComponents[comp.__o.name] = comp;

		if (!comp.__o.template) {
			const templateKeys = ['__t', '_t', 'Template', 'template'];
			if (templateKeys.find(k => k in comp.prototype)) {
				for (let k of templateKeys) {
					if (Object.prototype.hasOwnProperty.call(comp.prototype, k)) {
						comp.__o.template = convertTemplate(Object.getOwnPropertyDescriptor(comp.prototype, k) as any);
						break;
					}
				}
			}
		}

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
		for (let k in globalComponents) {
			app.component(k, globalComponents[k]);
		}
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