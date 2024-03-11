import './wNumb.min.js';

declare var wNumb: any;

interface IConfig {
	min?: number;
	max?: number;
	defaultValue?: number;
	onChange?: (data: { value: number; maskedValue: string; }) => void;
	onInput?: (data: { value: number; maskedValue: string; }) => void;
	format?: IFormat
}

interface IFormat {
	decimals?: number;
	thousandSeparator?: string;
	decimalsSeparator?: string;
	removeTrailingDecimals?: boolean;
}

interface IwNumb {
	to: (value: number) => string | boolean;
	from: (value: string) => number | boolean;
}

export default class LInputNumber {
	private config: IConfig = {
		min: 0,
		max: 10000,
		defaultValue: 0,
		format: {
			decimals: 0,
			thousandSeparator: ' ',
			decimalsSeparator: ',',
			removeTrailingDecimals: true
		},
		onChange: (): { value: number; maskedValue: string } => {
			return {value: this.value, maskedValue: this.maskedValue}
		},
		onInput: (): { value: number; maskedValue: string } => {
			return {value: this.value, maskedValue: this.maskedValue}
		}
	};
	private input: HTMLInputElement | null = null;
	private format: IwNumb | null = null;
	private value: number = 0;
	private maskedValue: string = '0';

	constructor(element: HTMLInputElement | null, userConfig?: IConfig) {
		if (!element) {
			console.error('LInputNumber: element is required');
			return;
		}

		this.init(element, userConfig);
	};

	private init(element: HTMLInputElement, userConfig?: IConfig) {
		this.initConfig(userConfig);
		this.initFormat();

		this.input = element;
		this.input.addEventListener('change', (event: Event) => this.onChangeElement(event));
		this.input.addEventListener('input', (event: Event) => this.onInputElement(event));

		this.initValue();
	};

	private initConfig(userConfig: IConfig = {}) {
		this.config = {
			min: typeof userConfig.min === 'number' ? userConfig.min : this.config.min,
			max: typeof userConfig.max === 'number' ? userConfig.max : this.config.max,
			defaultValue: typeof userConfig.defaultValue === 'number' ? userConfig.defaultValue : this.config.defaultValue,
			onChange: typeof userConfig.onChange === 'function' ? userConfig.onChange : this.config.onChange,
			onInput: typeof userConfig.onInput === 'function' ? userConfig.onInput : this.config.onInput,
			format: {
				decimals: typeof userConfig.format?.decimals === 'number' ? userConfig.format?.decimals : this.config.format?.decimals,
				thousandSeparator: typeof userConfig.format?.thousandSeparator === 'string' ? userConfig.format?.thousandSeparator : this.config.format?.thousandSeparator,
				decimalsSeparator: typeof userConfig.format?.decimalsSeparator === 'string' ? userConfig.format?.decimalsSeparator : this.config.format?.decimalsSeparator,
				removeTrailingDecimals: typeof userConfig.format?.removeTrailingDecimals === 'boolean' ? userConfig.format?.removeTrailingDecimals : this.config.format?.removeTrailingDecimals,
			}
		}
	};

	private initFormat() {
		if (!wNumb) return;

		this.format = wNumb({
			mark: this.config.format?.decimalsSeparator,
			thousand: this.config.format?.thousandSeparator,
			decimals: this.config.format?.decimals,
		});
	};

	private initValue() {
		let resultValue: number | undefined;

		if (typeof this.config?.defaultValue === 'number') {
			resultValue = this.config.defaultValue;

			if (typeof this.config.max === "number" && resultValue > this.config.max) {
				resultValue = this.config.max;
				return this.setValue(resultValue);
			}

			if (typeof this.config.min === "number" && resultValue < this.config.min) {
				resultValue = this.config.min;
				return this.setValue(resultValue);
			}

			this.setValue(resultValue);
		} else {
			resultValue = typeof this.config.min === 'number' ? this.config.min : 0;
			console.error('The defaultValue must be number');
			this.setValue(resultValue);
		}
	};

	private onChangeElement(event: Event) {
		const target: HTMLInputElement = event.target as HTMLInputElement;
		let resultValue: number | boolean | undefined = this.format ? this.format.from(target.value) : Number(target.value);

		const decimalsSeparator = this.config.format?.decimalsSeparator
		const thousandSeparator = this.config.format?.thousandSeparator

		if (typeof resultValue === 'boolean') {
			const regex = new RegExp('[^0-9' + decimalsSeparator + thousandSeparator + ']', 'g');

			const strValue = String(target.value).replace(regex, '');
			resultValue = strValue ? parseFloat(strValue) : this.config.min;
		} else {
			if (typeof this.config.min === 'number' && resultValue < this.config.min) {
				resultValue = this.config.min;
			}

			if (typeof this.config.max === 'number' && resultValue > this.config.max) {
				resultValue = this.config.max;
			}
		}

		this.setValue(resultValue as number);

		if (this.config.onChange) {
			this.config.onChange({value: this.value, maskedValue: this.maskedValue});
		}
	};

	private onInputElement(event: Event) {
		const target: HTMLInputElement = event.target as HTMLInputElement;
		let value: string = target.value;

		if (!value) return;

		const decimalsSeparator = this.config.format?.decimalsSeparator;
		const thousandSeparator = this.config.format?.thousandSeparator;
		const decimals = this.config.format?.decimals;
		const removeTrailingDecimals = this.config.format?.removeTrailingDecimals;

		const regex = new RegExp('[^0-9' + decimalsSeparator + thousandSeparator + '.]', 'g');
		value = value.replace(regex, '');

		if (decimals === 0) {
			value = this.format?.to(this.format?.from(value.replace(/\D/g, '')) as number) as string;
			target.value = value;
			if (this.config.onInput) {
				this.config.onInput({value: this.format?.from(value.replace(/\D/g, '')) as number, maskedValue: value});
			}
			return;
		}

		if (thousandSeparator !== '.') {
			value = value.replace(/\./g, decimalsSeparator as string);
		}

		const index = value.indexOf(decimalsSeparator as string);
		if (index !== -1) {
			value = value.substring(0, index + 1) + value.substring(index + 1).replace(new RegExp(decimalsSeparator as string, 'g'), '');
		}

		const parts = value.split(decimalsSeparator as string);
		const decimalPart = parts[1];

		if (value.endsWith(decimalsSeparator as string)) {
			target.value = value;
			if (this.config.onInput) {
				this.config.onInput({value: this.value, maskedValue: value});
			}
			return;
		} else if (decimalPart) {
			if (decimalPart.length > (decimals as number)) {
				value = this.format?.to(this.format?.from(value) as number) as string;

				if (removeTrailingDecimals) {
					this.removedTrailingDecimals(value);
				}
			}
		} else {
			value = this.format?.to(this.format?.from(value) as number) as string;

			if (removeTrailingDecimals) {
				value = this.removedTrailingDecimals(value);
			}
		}

		target.value = value;
		if (this.config.onInput) {
			this.config.onInput({value: this.value, maskedValue: value});
		}
	}


	setValue(value: number) {
		this.value = value;

		let formattedValue = this.format ? this.format.to(value) as string : String(value);
		const removeTrailingDecimals = this.config.format?.removeTrailingDecimals;

		if (removeTrailingDecimals) {
			formattedValue = this.removedTrailingDecimals(formattedValue);
		}

		this.maskedValue = formattedValue;

		if (this.input) {
			this.input.value = this.maskedValue;
		}
	};

	private removedTrailingDecimals(value: string): string {
		const decimalsSeparator = this.config.format?.decimalsSeparator;
		const parts = value.split(decimalsSeparator as string);

		if (parts.length === 2) {
			let integerPart = parts[0];
			let decimalPart = parts[1];

			decimalPart = decimalPart.replace(/0+$/, '');

			if (decimalPart === '') {
				return integerPart;
			}

			return integerPart + decimalsSeparator + decimalPart;
		}

		return value;
	}
}