import { warn } from 'vue';
import { PropOptions, WithDefault } from 'vue-class-component';



// import type { PropType } from 'vue';
// import { PropOptions, Vue, prop, PropOptionsWithDefault, PropOptionsWithRequired, WithDefault } from '../../../src'

// type PropOptions<T = any, D = T> = VueClassComponent.PropOptions<T, D>;
// type WithDefault<T> = VueClassComponent.WithDefault<T>;
// type PropType<T> = Vue.PropType<T>;


export type Constructor = abstract new (...args: any) => any;
export type SimpleType = number | string | boolean | null;// | undefined;

// type AssertTypeEqual<T, V extends T, Z extends V> = T & V & Z;


export type ValidPropDescription =
	| number | string | boolean | undefined // simple types
	| null // any
	| Constructor // nullable
	| (number | string | boolean | null | Constructor | undefined)[]
	| [...(number | string | boolean | null | Constructor | undefined)[], object]
	| PropOptions;


export type ExtractTypeSingle<T>
	// = T extends (Constructor & ((...args: any[]) => infer V)) ? V
	= T extends NumberConstructor ? number
	: T extends StringConstructor ? string
	: T extends BooleanConstructor ? boolean
	: T extends abstract new (...args: any) => infer V ? V
	: T extends undefined ? never
	: T;

export type ExtractType<T>
	= T extends Array<infer V> ? ExtractTypeSingle<V>
	// : T extends (Constructor & ((...args: any[]) => infer V)) ? V
	: T extends NumberConstructor ? number
	: T extends StringConstructor ? string
	: T extends BooleanConstructor ? boolean
	: T extends abstract new (...args: any) => infer V ? V
	: T;

// type ExtractTypesIn<T>
// 	= { [K in keyof T]: ExtractType<T[K]> }



export type ExtractDefault<T>
	= T extends [...any[], infer P, infer D] ? (
		D extends null ? D  // last null
		: P extends Exclude<SimpleType, undefined> ? never // enums
		: D extends SimpleType ? D : never // [constructor, default]
	)
	: T extends [infer D] ? (D extends SimpleType ? D : never) // [default] - FIXME: what's that, a const?
	: T extends abstract new (...args: any) => any ? never // FIXME: single constructor - what should it do?
	: T; // FIXME: function - what should it do?

// type ExtractDefaultsIn<T>
// 	= { [K in keyof T]: ExtractDefault<T[K]> }



interface PropOptionsWith<T, D, R extends boolean> extends PropOptions<T, D> {
	required: R,
	default: D extends T ? PropOptions<T, D>['default'] : never,
}








type ConstructOptions<T> = {
	[K in keyof T]: ConstructSingleOption<T[K]>
}
type ConstructSingleOption<T>
	// [String]
	= never extends ExtractDefault<T> ? PropOptionsWith<ExtractType<T>, never, false>
	// [String, null]
	: null extends ExtractDefault<T> ? PropOptionsWith<ExtractType<T>, ExtractDefault<T>, true>
	: undefined extends ExtractDefault<T> ? PropOptionsWith<ExtractType<T>, ExtractDefault<T>, true>
	// [String, "default-value"]
	: PropOptionsWith<ExtractType<T>, ExtractDefault<T>, false>


export type ConstructPropClass<T>
	= {
		[K in keyof T as ExtractDefault<T[K]> extends never ? K : never]
		: WithDefault<ExtractType<T[K]>>
	} & {
		[K in keyof T as ExtractDefault<T[K]> extends never ? never : K]?
		: ExtractType<T[K]>
	};

function makeValidator<T extends ValidPropDescription>(meta: T, key: string): (value: unknown) => value is ExtractType<T> {
	/* Vue uses this hack, should is be used here?
			// use function string name to check type constructors
			// so that it works across vms / iframes.
			function getType(ctor: Prop<any>): string {
				const match = ctor && ctor.toString().match(/^\s*function (\w+)/)
				return match ? match[1] : ctor === null ? 'null' : ''
			} */
	if (!Array.isArray(meta)) throw new Error('FIXME');

	const typeofs = ['string', 'number', 'bigint', 'boolean', 'symbol', 'object', 'function'];
	let allowedValues = meta.filter(mt => typeof mt != 'function' && typeof mt != 'undefined');
	let allowedTypes = typeofs.filter(t => meta.find(mt => typeof mt == 'function' && mt.name.toLowerCase() == t));
	let allowedClasses = meta.filter(mt => typeof mt == 'function' && !typeofs.includes(mt.name.toLowerCase())) as Constructor[];

	if (allowedValues.includes(null) && !allowedValues.includes(undefined)) {
		allowedValues.push(undefined);
	}

	// this function can be optimized, but it's not required since validators are dev only
	return function (value: unknown): value is ExtractType<T> {
		if (allowedValues.includes(value as any)) return true;
		if (allowedTypes.includes(typeof value)) return true;
		if (allowedClasses.find(c => value instanceof c)) return true;
		let typeName = [...allowedValues, ...allowedTypes.map(e => 'type:' + e), ...allowedClasses.map(e => 'class:' + e.name)];
		warn(`Invalid prop: type check failed for prop %o. Expected one of %o, got %o. `, key, typeName, value);
		return false;
	}
}

export function makeClass<T extends Record<string, ValidPropDescription>>(propsMeta: T): { new(): ConstructPropClass<T> } {
	let props: Partial<ConstructOptions<T>> = {};
	(Object.keys(propsMeta) as (keyof T & keyof typeof props & string)[]).forEach((key) => {
		const meta: ValidPropDescription = propsMeta[key];
		if (typeof meta != 'object') throw new Error('FIXME');
		if (!Array.isArray(meta)) { props[key] = meta as ConstructSingleOption<T[typeof key]>; return; }

		let prop: Partial<PropOptionsWith<any, any, boolean>> = {};
		if (meta.length == 0) throw new Error('FIXME');
		if (meta.length == 1) {
			if (meta[0] == null) throw new Error('FIXME');
			// prop.type = meta as PropType<any>; // own validator is better
			prop.validator = makeValidator(meta, key);
			prop.required = true;
			// no default
		}
		if (meta.length > 1) {
			let last = meta[meta.length - 1];
			let prev = meta[meta.length - 2];
			// prop.type = meta as PropType<any>; // own validator is better
			prop.validator = makeValidator(meta, key);
			prop.required = true;
			if (typeof last != 'function') {
				if (last == null || typeof prev == 'undefined' || typeof prev == 'function') {
					prop.default = last;
					prop.required = false;
				}
			}
		}
		props[key] = prop as ConstructSingleOption<T[typeof key]>;
	})
	return class {
		constructor() {
			return props;
		}
	} as any;
}

// with<P extends { new (): unknown }>(
//     Props: P
//   ): VueConstructor<V & VueWithProps<Readonly<InstanceType<P>>>>

// function AssignProps<P extends { new(): unknown }, V extends VueConstructor>(
// 	VueSuper: V,
// 	Props: P
// ): VueConstructor<V & VueClassComponent.VueWithProps<Readonly<InstanceType<P>>>> {
// 	const propsMeta = new Props() as Record<string, Prop<any> | undefined>
// 	const props: Vue.ComponentObjectPropsOptions = {}

// 	Object.keys(propsMeta).forEach((key) => {
// 		const meta = propsMeta[key]
// 		props[key] = meta ?? null
// 	})
// 	// @ts-ignore  -- "mixin should have constructor(...a)"
// 	class PropsMixin extends VueSuper {
// 		static __b: Vue.ComponentOptions = {
// 			props,
// 		}
// 	}
// 	return PropsMixin as any;
// }

// @Component
// class TestVue extends VueImpl.with(makeClass(test4)) {
// 	@Template
// 	get template() {
// 		return `
// 			<div>
// 				<h1>TEST</h1>
// 				{{ this.$props }}
// 			</div>
// 		`
// 	}
// 	@Prop({ type: String }) strZ!: string;
// 	get allProps() {
// 		return this.enuA;
// 	}
// }
