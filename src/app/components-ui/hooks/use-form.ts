import { Dispatch, SetStateAction, useState } from 'react';

export function useForm<T>(initialState: T): {
	values: T;
	setValues: Dispatch<SetStateAction<T>>;
	handleValueChange(name: keyof T, value: unknown): void;
} {
	const [values, setValues] = useState<T>(initialState);

	const handleValueChange = (name: keyof T, value: unknown): void => {
		setValues((prevState) => {
			if (prevState[name] === value) {
				return prevState;
			}

			return { ...prevState, [name]: value };
		});
	};

	return { values, setValues, handleValueChange };
}
