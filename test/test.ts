import { Vue } from "vue-class-component";
import { makeClass } from "../src/index";


let cls = makeClass({
	a: [],
	b: [1, 2, 'a', undefined] as const,
} as const);

let c = new cls();
type C = typeof c;

let a = null;



class Test extends Vue.with(makeClass({
	any: [],
	anyN: [null],
} as const)) {
	f() {
		this.any
	}
}
let t = new Test();
