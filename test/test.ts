import { Vue } from "vue-class-component";
import { DefinitionObjectToProps, makeClass, PropOptionsWith } from "../src";

let a = {
	optAny: null,

	reqNum: Number,
	optNum: [Number],
	defNum: 123,

	reqNumStr: [Number, String, []],
	optNumStr: [Number, String],
	defNumStr: [Number, String, 123],

	reqLiteral: [[1, 2, 3], []],
	optLiteral: [[1, 2, 3]],
	defLiteral: [[1, 2, 3], 1]
} as const;

type A = DefinitionObjectToProps<typeof a>;
type B = {
	optAny: PropOptionsWith<any, never, false>;

	reqNum: PropOptionsWith<number, never, true>;
	optNum: PropOptionsWith<number, never, false>;
	defNum: PropOptionsWith<number, 123, false>;

	reqNumStr: PropOptionsWith<number | string, never, true>;
	optNumStr: PropOptionsWith<number | string, never, false>;
	defNumStr: PropOptionsWith<number | string, 123, false>;

	reqLiteral: PropOptionsWith<1 | 2 | 3, never, true>;
	optLiteral: PropOptionsWith<1 | 2 | 3, never, false>;
	defLiteral: PropOptionsWith<1 | 2 | 3, 1, false>;
}
type EnsureSame<T, V extends T, TT extends V> = T & V & TT;

declare let _: EnsureSame<A, B, A>;

class TestVue extends Vue.with(makeClass({
	optAny: null,

	reqNum: Number,
	optNum: [Number],
	defNum: 123,

	reqNumStr: [Number, String, []],
	optNumStr: [Number, String],
	defNumStr: [Number, String, 123],

	reqLiteral: [[1, 2, 3], []],
	optLiteral: [[1, 2, 3]],
	defLiteral: [[1, 2, 3], 1]
} as const)) {
	
}

// // let cls = makeClass({
// // 	a: [],
// // 	b: [1, 2, 'a', undefined] as const,
// // } as const);

// // let c = new cls();
// // type C = typeof c;

// // let a = null;



// class Test extends Vue.with(makeClass({
// 	any: [],
// 	anyN: [null, 1, 2, 3],
// } as const)) {
// 	f() {
// 		this.any
// 	}
// }
// let t = new Test();


// type _1t = ExtractType<[]>;
// type _1d = ExtractDefault<[]>
// // export type ConstructPropClass<T>
// // 	= {
// // 		[K in keyof T as ExtractDefault<T[K]> extends never ? never : K]
// // 		: WithDefault<ExtractType<T[K]>, ExtractDefault<T[K]>>
// // 	} & {
// // 		[K in keyof T as ExtractDefault<T[K]> extends never ? K : never]
// // 		: ExtractType<T[K]>
// // 	};


