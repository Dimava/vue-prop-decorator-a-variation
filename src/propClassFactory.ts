import { warn } from 'vue'
import { PropOptions, WithDefault } from 'vue-class-component'

export type Constructor = abstract new (...args: any) => any
export type SimpleType = number | string | boolean | null // | undefined;

export type ValidPropDefinition =
	| number | string | boolean | null
	| Constructor
	| readonly (number | string | boolean | null | Constructor | undefined)[]
	| PropOptions

export type ExtractPropTypeSingle<T> =
	| T extends NumberConstructor ? number
	: T extends StringConstructor ? string
	: T extends BooleanConstructor ? boolean
	: T extends abstract new (...args: any) => infer V ? V
	: T extends undefined ? never
	: T // null, 123, 'wasd', {}, ()=>{}

export type Supertype<T> =
	| T extends number ? number
	: T extends string ? string
	: T extends boolean ? boolean
	: T extends null ? any
	: never

export type ExtractPropType<T> =
	| T extends readonly [] ? any
	: T extends readonly (infer V)[] ? ExtractPropTypeSingle<V>
	: T extends NumberConstructor ? number
	: T extends StringConstructor ? string
	: T extends BooleanConstructor ? boolean
	: T extends abstract new (...args: any) => infer V ? V
	: Supertype<T> // null, 123, 'wasd', {}, ()=>{}

export type ExtractPropTypesIn<T> = { [K in keyof T]: ExtractPropType<T[K]> }

export type ExtractPropDefault<T> =
	| T extends readonly [...any[], infer P, infer D] ? (
		| D extends null ? D // last null
		: P extends Exclude<SimpleType, undefined> ? never // enums
		: D extends SimpleType ? D
		: never // [constructor, default]
	)
	: T extends readonly [infer D] ? (
		| D extends SimpleType ? D
		: never // [default] - FIXME: what's that, a const?
	)
	: T extends readonly [] ? never
	: T extends abstract new (...args: any) => any ? never // FIXME: single constructor - what should it do?
	: T extends Exclude<SimpleType, null | undefined> ? T
	: never // FIXME: function - what should it do?

export type ExtractPropDefaultsIn<T> = {
	[K in keyof T]: ExtractPropDefault<T[K]>
}

export interface PropOptionsWith<T, D, R extends boolean>
	extends PropOptions<T, D> {
	required: R
	default: D extends T ? PropOptions<T, D>['default'] : never
}

type ConstructPropOptions<T> = {
	[K in keyof T]: ConstructSingleOption<T[K]>
}

export type ConstructSingleOption<T> =
	// [String]
	never extends ExtractPropDefault<T> ? PropOptionsWith<ExtractPropType<T>, never, false>
	// [String, null]
	: null extends ExtractPropDefault<T> ? PropOptionsWith<ExtractPropType<T>, ExtractPropDefault<T>, true>
	: undefined extends ExtractPropDefault<T> ? PropOptionsWith<ExtractPropType<T>, ExtractPropDefault<T>, true>
	// [String, "default-value"]
	: PropOptionsWith<ExtractPropType<T>, ExtractPropDefault<T>, false>

export type ConstructPropClass<T> = {
	[K in keyof T as ExtractPropDefault<T[K]> extends never ? never : K]
	?: WithDefault<ExtractPropType<T[K]>>
} & {
		[K in keyof T as ExtractPropDefault<T[K]> extends never ? K : never]
		: ExtractPropType<T[K]>
	}

function makeValidator<T extends ValidPropDefinition>(
	meta: T,
	key: string
): (value: unknown) => value is ExtractPropType<T> {
	/* Vue uses this hack, should is be used here?
		// use function string name to check type constructors
		// so that it works across vms / iframes.
		function getType(ctor: Prop<any>): string {
			const match = ctor && ctor.toString().match(/^\s*function (\w+)/)
			return match ? match[1] : ctor === null ? 'null' : ''
		} */
	if (!Array.isArray(meta)) throw new Error('FIXME');

	const typeofs = [
		'string',
		'number',
		'bigint',
		'boolean',
		'symbol',
		'object',
		'function',
	];
	let allowedValues = meta.filter(
		(mt) => typeof mt != 'function' && typeof mt != 'undefined'
	);
	let allowedTypes = typeofs.filter((t) =>
		meta.find((mt) => typeof mt == 'function' && mt.name.toLowerCase() == t)
	);
	let allowedClasses = meta.filter(
		(mt) => typeof mt == 'function' && !typeofs.includes(mt.name.toLowerCase())
	) as Constructor[];

	if (allowedValues.includes(null) && !allowedValues.includes(undefined)) {
		allowedValues.push(undefined);
	}

	// this function can be optimized, but it's not required since validators are dev only
	return function (value: unknown): value is ExtractPropType<T> {
		if (allowedValues.includes(value as any)) return true;
		if (allowedTypes.includes(typeof value)) return true;
		if (allowedClasses.find((c) => value instanceof c)) return true;
		let typeName = [
			...allowedValues,
			...allowedTypes.map((e) => 'type:' + e),
			...allowedClasses.map((e) => 'class:' + e.name),
		];
		warn(
			`Invalid prop: type check failed for prop %o. Expected one of %o, got %o. `,
			key, typeName, value
		);
		return false;
	}
}

export type PropsDefinition = {
	readonly [propName: string]: ValidPropDefinition
}

export function makePropClass<T extends PropsDefinition>(
	propsMeta: T
): { new(): ConstructPropClass<T> } {
	let props: Partial<ConstructPropOptions<T>> = {};
	(Object.keys(propsMeta) as (keyof T & keyof typeof props & string)[])
		.forEach((key) => {
			const source: ValidPropDefinition = propsMeta[key];
			let meta!: any[];
			if (typeof source == 'function') {
				meta = [source];
			} else if (typeof source == 'object') {
				if (!source) {
					meta = [null];
				} else if (!Array.isArray(source)) {
					props[key] = source as ConstructSingleOption<T[typeof key]>;
				} else {
					meta = source;
				}
			} else if ((source as any).constructor) {
				meta = [(source as any).constructor];
			} else if (source == undefined) {
				return;
			}

			let prop: Partial<PropOptionsWith<any, any, boolean>> = {}
			if (meta.length == 0) {
				prop.required = true;
			}
			if (meta.length == 1) {
				if (meta[0] == null) {
					prop.required = false;
				} else {
					// prop.type = meta as PropType<any>; // own validator is better
					prop.validator = makeValidator(meta, key);
					prop.required = true;
					// no default
				}
			}
			if (meta.length > 1) {
				let last = meta[meta.length - 1];
				let prev = meta[meta.length - 2];
				// prop.type = meta as PropType<any>; // own validator is better
				prop.validator = makeValidator(meta, key);
				prop.required = true;
				if (typeof last != 'function') {
					if (
						last == null ||
						typeof prev == 'undefined' ||
						typeof prev == 'function'
					) {
						prop.default = last;
						prop.required = false;
					}
				}
			}
			props[key] = prop as ConstructSingleOption<T[typeof key]>;
		});
	return class {
		constructor() {
			return props;
		}
	} as any;
}