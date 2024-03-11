declare module 'wnumb' {
	interface FormatOptions {
		mark?: string;
		thousand?: string;
		decimals?: number;
	}

	interface wNumbInstance {
		(options: FormatOptions): {
			to: (value: number) => string;
			from: (value: string) => number;
		};
	}

	const wNumb: wNumbInstance;
	export default wNumb;
};