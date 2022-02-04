# Opject form Property Definition


### Usage:
```ts
import { Vue } from 'vue-class-component';
import { makeClass } from '@dimava/vue-prop-decorator-a-variation';

class TestVue extends Vue.with(makeClass({
	optional_Any: null,

	required_Number: Number,
	optional_Number: [Number],
	default__Number: 123,

	required_NumStr: [Number, String, []],
	optional_NumStr: [Number, String],
	default__NumStr: [Number, String, 123],

	required_Class: Date,
	optional_Class: [Date],
	default__Class: [Date, /* const */ new Date()],

	required_Literal: [[1, 2, 3], []],
	optional_Literal: [[1, 2, 3]],
	default__Literal: [[1, 2, 3], 1],
} as const)) {
};
```