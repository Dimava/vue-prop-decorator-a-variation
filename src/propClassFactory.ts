import { warn } from 'vue'
import { PropOptions } from 'vue-class-component';
import { DefinitionObjectToProps, PropOptionsInfo, ValidPropDefinition } from './propTypes';

/**
 * Makes valudator out of definition array  
 * *Class check requires the constructor which is bad for treeshaking* - fixme
 */
function makeValidator<T extends Exclude<ValidPropDefinition, PropOptions>, PT = PropOptionsInfo<T>['type']>(
	propDefinition: T,
	key: string,
): (value: unknown) => value is PT {
	const types = {
		number: Number,
		string: String,
		bigint: BigInt,
		boolean: Boolean,
		symbol: Symbol,
		object: Object,
		function: Function,
		undefined: undefined,
	};
	let list: Extract<ValidPropDefinition, readonly any[]> =
		Array.isArray(propDefinition) ? propDefinition
			: typeof propDefinition == 'function' ? [propDefinition]
				: [types[typeof propDefinition]];

	let allowedValues = list.flatMap(e =>
		Array.isArray(e) ? e : []
	);
	let allowedTypes = list.flatMap(e =>
		typeof e == 'function' && (types as Record<string, any>)[e.name.toLowerCase()] == e ? [e.name.toLowerCase()] : []
	)
	let allowedClasses = list.flatMap(e =>
		typeof e == 'function' && (types as Record<string, any>)[e.name.toLowerCase()] != e ? [e] : []
	);

	return function (value: unknown): value is PT {
		if (allowedValues.includes(value)) return true;
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
	};
}

export function makePropClass<T extends Record<string, ValidPropDefinition>>(
	propDefinitionObject: T
): { new(): DefinitionObjectToProps<T> } {
	let props: Record<string, PropOptions> = {};
	for (let key in propDefinitionObject) {
		const source: ValidPropDefinition = propDefinitionObject[key];
		if (typeof source == 'object') {
			if (source == null) {
				props[key] = {
					required: false,
				};
				continue;
			} else if (!Array.isArray(source)) {
				props[key] = source as PropOptions;
				continue
			}
		}
		const required =
			Array.isArray(source) ? !!source.find(e => Array.isArray(e) && e.length == 0)
				: typeof source == 'function' ? true
					: false;
		const defaultV =
			Array.isArray(source) ? source.find(e => !Array.isArray(e) && typeof e != 'function')
				: typeof source == 'function' ? undefined
					: source;
		const validator = makeValidator(source, key);

		props[key] = {
			required,
			default: defaultV,
			validator,
		};
	}
	return class {
		constructor() {
			return props;
		}
	} as any;
}