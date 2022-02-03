import { PropOptions } from "vue-class-component"


export interface PropOptionsWith<Type, Default, Required extends boolean> extends PropOptions<Type, Default> {
	required: Required;
	default: Default extends Type ? PropOptions<Type, Default>['default'] : never;
	validator?(value: unknown): value is Type;
}

export type Constructor<T = any> = abstract new (...args: any) => T;
export type SimpleType = number | string | boolean;
export type SimpleTypeConstructor = NumberConstructor | StringConstructor | BooleanConstructor;

export type InstanceOf<T> =
	| T extends NumberConstructor ? number
	: T extends StringConstructor ? string
	: T extends BooleanConstructor ? boolean
	: T extends abstract new (...args: any) => infer V ? V
	: T extends null ? any
	: T extends readonly (infer V)[] ? V
	: T extends SimpleType ? never
	: never;

export type ConstructorOfSimple<T> =
	| T extends number ? NumberConstructor
	: T extends string ? StringConstructor
	: T extends boolean ? BooleanConstructor
	: never;

export type SupertypeOfSimple<T> =
	| T extends number ? number
	: T extends string ? string
	: T extends boolean ? boolean
	: T extends null ? any
	: never;

export type ValidPropDefinition =
	| null
	| SimpleType
	| SimpleTypeConstructor
	| Constructor
	| readonly (SimpleType | SimpleTypeConstructor | Constructor | readonly (any)[])[]
	| PropOptions;

export type DefinitionToProp<T extends ValidPropDefinition> =
	| T extends PropOptions ? T
	// null -> required any
	: null extends T ? PropOptionsWith<any, never, false>
	// 123 -> optional number
	: T extends SimpleType ? PropOptionsWith<SupertypeOfSimple<T>, T, false>
	// NumberConstructor -> required number
	: T extends SimpleTypeConstructor ? PropOptionsWith<InstanceOf<T>, never, true>
	// DateConstructor -> required Date
	: T extends Constructor<infer C> ? PropOptionsWith<C, never, true>
	// array -> ...
	: T extends readonly (infer V)[] ? DefinitionArrayToProp<V>
	: never;

export type DefinitionArrayToProp<V> =
	PropOptionsWith<
		InstanceOf<V>,
		Extract<V, SimpleType>,
		Extract<V, readonly never[]> extends never ? false : true
	>;

export type DefinitionObjectToProps<T extends Record<string, ValidPropDefinition>> =
	{
		[k in keyof T]: DefinitionToProp<T[k]>;
	};

export type DefinitionObjectToPropClass<T extends Record<string, ValidPropDefinition>> =
	{
		new(): DefinitionObjectToProps<T>;
	};

export type PropOptionsInfo<T extends ValidPropDefinition | PropOptionsWith<any, any, any>> =
	| T extends PropOptionsWith<infer PT, infer PD, infer PR> ? {
		type: PT, default: PD, required: PR,
	}
	: PropOptionsInfo<DefinitionToProp<T>>;
