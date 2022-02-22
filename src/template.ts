import { ComponentOptions } from "vue";
import { VueBase, VueConstructor } from "vue-class-component";


export function convertTemplate(descriptor: TypedPropertyDescriptor<string>): string {
	let template = '';
	let value = descriptor.value ?? descriptor.get ?? '';

	if (typeof value == 'function') {
		let g0 = /`([^]*)`/;
		// fixme I would like ability to use objects inside
		//   /  (?<opn>  = | =" | =' | \{\{ | \{ |)  \$  \{  (?<val>[^}]+)  \}  (?<cls> \}\} | \} | " | ' |)  /g 
		let g2 = /(?<opn>=|="|='|\{\{|\{|)\$\{(?<val>[^}]+)\}(?<cls>\}\}|\}|"|'|)/g
		let f2 = (_s: string, groups: Record<string, string>): string => {
			let { opn, val, cls } = groups;
			let os = `${opn}_${cls}`;
			if (os == '=_') return `${opn}"${val.replaceAll('"', '\"')}"${cls}`;
			if (os == '{_}') return `${opn}{${val}}${cls}`;
			return `${opn}${val}${cls}`;
		}
		template = (value + '').match(g0)![1].trim().replaceAll(g2, (s, ...args) => f2(s, args[args.length - 1]));
		let whitespace = template.match(/\n[ \t]*/g)?.reduce((v, e) => v.length < e.length ? v : e) ?? '\n';
		template = template.replaceAll(whitespace, '\n');
	} else if (typeof value == 'string') {
		template = value;
		let whitespace = template.match(/\n[ \t]*/g)?.reduce((v, e) => v.length < e.length ? v : e) ?? '\n';
		template = template.replaceAll(whitespace, '\n');
	} else {
		throw new Error('Template descriptor is not a string or a function');
	}
	return template;
}


export function Template<V extends VueConstructor, K extends keyof V>(target: V, propertyKey: K): void;
export function Template<V extends VueBase, K extends keyof V>(target: V, propertyKey: K, descriptor: TypedPropertyDescriptor<string>): void;
export function Template<V extends VueConstructor | VueBase, K extends keyof V>(target: V, propertyKey: K, descriptor?: TypedPropertyDescriptor<string>) {
	let t = (typeof target == 'function' ? target : target.constructor) as V & { __o: ComponentOptions };
	let template = '';

	if (descriptor) {
		template = convertTemplate(descriptor);
	} else {
		template = convertTemplate(target[propertyKey]);
	}

	t.__o = Object.assign(t.__o ?? {}, { template });
};