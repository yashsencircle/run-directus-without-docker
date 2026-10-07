import InterfaceComponent from './interface.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	description: 'This is my custom interface!',
	component: InterfaceComponent,
	options: [
	  {
		field: 'placeholder',
		name: 'Placeholder Tag',
		type: 'string',
		schema: { default_value: 'Type a tag and press Enter' },
		interface: 'input',
	  },
    ],
	types: ['json'],
};
