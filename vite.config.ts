import {resolve} from 'path';

export default {
	build: {
		lib: {
			entry: resolve(__dirname, 'input-number/index.js'),
			name: 'LInputNumber',
			fileName: 'l-input-number'
		}
	}
}