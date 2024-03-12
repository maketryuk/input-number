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
		max: 100,
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
				decimals: typeof userConfig.format?.decimals === 'number' ? userConfig.format?.decimals : this.config.format?.decimals as number,
				thousandSeparator: typeof userConfig.format?.thousandSeparator === 'string' ? userConfig.format?.thousandSeparator : this.config.format?.thousandSeparator as string,
				decimalsSeparator: typeof userConfig.format?.decimalsSeparator === 'string' ? userConfig.format?.decimalsSeparator : this.config.format?.decimalsSeparator as string,
				removeTrailingDecimals: typeof userConfig.format?.removeTrailingDecimals === 'boolean' ? userConfig.format?.removeTrailingDecimals : this.config.format?.removeTrailingDecimals as boolean,
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
		const handleInput = (target: HTMLInputElement, inputValue: string) => {
			let value: string = inputValue;
			const cursorPosition: number = target.selectionStart || 0;

			if (!value) return;

			let cleanedValue: string = value.replace(new RegExp(`[^0-9.${this.config.format?.decimalsSeparator}${this.config.format?.thousandSeparator} ]`, 'g'), '');

			if (this.config.format?.thousandSeparator !== '.') {
				cleanedValue = cleanedValue.replace(/\./g, this.config.format?.decimalsSeparator as string);
			}

			const regex = new RegExp(`(\\${this.config.format?.decimalsSeparator})(?=.*\\${this.config.format?.decimalsSeparator})`, 'g');
			cleanedValue = cleanedValue.replace(regex, '');

			const isEmptyValue = !cleanedValue.replace(/\D/g, '');

			if (isEmptyValue) {
				if (this.config.format?.removeTrailingDecimals) {
					cleanedValue = this.removedTrailingDecimals(this.format?.to(this.config?.min as number) as string);
				} else {
					cleanedValue = this.format?.to(this.config?.min as number) as string;
				}
			}

			const unmaskedValue: number | boolean | undefined = this.format?.from(cleanedValue);
			const parts: string[] = cleanedValue.split(this.config.format?.decimalsSeparator as string);

			const thousandsPart: string = parts[0] ? parts[0] : (this.format?.to(this.config.min as number) as string).split(this.config.format?.decimalsSeparator as string)[0];
			const decimalsPart: string = parts?.[1];

			const unmaskedThousands: number = this.format?.from(thousandsPart) as number;

			const maskedThousands = (str: number): string => {
				let result: string = this.format?.to(str as number) as string;

				if (this.config.format?.removeTrailingDecimals) {
					result = this.removedTrailingDecimals(result);
				}

				return result;
			}

			if (decimalsPart !== undefined) {
				cleanedValue = maskedThousands(unmaskedThousands) + this.config.format?.decimalsSeparator + decimalsPart;
				value = cleanedValue;
			} else {
				cleanedValue = maskedThousands(unmaskedThousands);
				value = cleanedValue;
			}

			if (cleanedValue.endsWith(this.config.format?.decimalsSeparator as string)) {
				value = cleanedValue;

				target.value = value;
				target.setSelectionRange(cursorPosition, cursorPosition);

				if (this.config.onInput) {
					this.config.onInput({ value: unmaskedValue as number, maskedValue: value });
				}
				return;
			}

			if (this.config.format?.decimals === 0 && typeof unmaskedValue === "number") {
				value = this.format?.to(unmaskedValue as number) as string;

				target.value = value;
				target.setSelectionRange(cursorPosition, cursorPosition);

				if (this.config.onInput) {
					this.config.onInput({ value: unmaskedValue, maskedValue: value });
				}
				return;
			}

			if (typeof this.config.format?.decimals === 'number' && decimalsPart && decimalsPart.length > this.config.format?.decimals) {
				value = this.format?.to(unmaskedValue as number) as string;

				if (this.config.format?.removeTrailingDecimals) {
					value = this.removedTrailingDecimals(value);
				}

				target.value = value;
				target.setSelectionRange(cursorPosition, cursorPosition);

				if (this.config.onInput) {
					this.config.onInput({ value: unmaskedValue as number, maskedValue: value });
				}
				return;
			}

			target.value = value;
			target.setSelectionRange(cursorPosition, cursorPosition);

			if (this.config.onInput) {
				this.config.onInput({ value: unmaskedValue as number, maskedValue: value });
			}
		};

		if (event.type === 'input') {
			const target: HTMLInputElement = event.target as HTMLInputElement;
			const value: string = target.value as string;

			handleInput(target, value);
		}

		if (event.type === 'paste') {
			event.preventDefault();

			const target: HTMLInputElement = event.target as HTMLInputElement;

			const clipboardData = (event as ClipboardEvent).clipboardData;
			const pastedText = clipboardData?.getData('text');

			if (pastedText) {
				handleInput(target, pastedText);
			}
		}
	};

	private removedTrailingDecimals(value: string): string {
		const result = value;
		const decimalsSeparator = this.config.format?.decimalsSeparator;
		const parts = result.split(decimalsSeparator as string);

		if (parts && parts.length === 2) {
			let integerPart = parts[0];
			let decimalPart = parts[1];

			decimalPart = decimalPart.replace(/0+$/, '');

			if (decimalPart === '') {
				return integerPart;
			}

			return integerPart + decimalsSeparator + decimalPart;
		}

		return result;
	};

 	private setValue(value: number) {
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

	set(value: number) {
		this.setValue(value);
	}
}