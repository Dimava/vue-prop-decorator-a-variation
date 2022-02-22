
export * from './propTypes';

export {
	makePropClass as makeClass,
} from './propClassFactory';

export { Template } from './template';

export { GlobalComponent as Component, globalComponents, known, custom } from './globalComponent';


import { createApp as capp, CreateAppFunction } from 'vue';
import { custom, known } from './globalComponent';



import { Vue } from "vue-class-component";
import { makePropClass } from './propClassFactory';
import { ValidPropDefinition } from './propTypes';


export const VueWithProps =
	function <T extends Record<string, ValidPropDefinition>>(
		propDefinitionObject: T
	) {
		return Vue.with(makePropClass(propDefinitionObject))
	};

export const createApp: CreateAppFunction<Element> = function createApp(...a) {
	return capp(...a).use(known).use(custom);
};