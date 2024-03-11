import {resolve} from 'path';

export default {
	build: {
		lib: {
			entry: resolve(__dirname, 'src/main.ts'),
			name: 'LInputNumber',
			fileName: 'l-input-number'
		}
	}
}