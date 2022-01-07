// import { Vue } from "vue-class-component";
// import { makeClass } from "../src/index";


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


