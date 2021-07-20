import { useState } from 'react';
import Select from '@/components/Select';
import { ITEMS } from '@/util/constants';
import { IGameItem } from '@/util/ui';
import {
	FormControl,
	FormLabel,
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputStepper
} from '@chakra-ui/react';

interface IOtherTaxLawForm {
	product: number | null;
	setProduct: (productId: number) => void;
	percentage: number;
	setPercentage: (productId: number, percentage: number) => void;
}
  
function OtherTaxLawForm({ product, percentage, setProduct, setPercentage }: IOtherTaxLawForm) {
	const [productId, setProductId] = useState<number | null>(product);

	const updateProduct = (value: number) => {
		setProductId(value);
		setProduct(value);
	}

	return (
		<>
			<div className='mt-2'>
				<FormControl>
					<FormLabel>Product</FormLabel>
					<Select className='border border-white border-opacity-25 rounded shadow-md' selected={product} onChange={(value) => updateProduct(value as number)}>
						<Select.Option disabled value={null}>
							Select Product Type
						</Select.Option>
						{ITEMS.reduce((accum: IGameItem[], item: any) => {
							let exists = accum.findIndex((p: IGameItem) => p.name === item.name) !== -1;

							if (!exists)
								accum.push(item);

							return accum;
						}, []).map((item: IGameItem, i: number) => (
							<Select.Option key={i} value={item.id}>
								<p className='flex items-center'>
									<span className='flex items-center gap-2'>
										<i className={`sot-icon ${item.image}`} title={item.name} />
										{item.name}
									</span>
								</p>
							</Select.Option>
						))}
					</Select>
				</FormControl>
			</div>
			<div className='mt-2'>
				<FormControl>
					<FormLabel>Percentage</FormLabel>
					<NumberInput
						className='border border-white border-opacity-25 rounded shadow-md'
						min={0}
						max={100}
						step={1}
						defaultValue={percentage}
						onChange={(_, val) => setPercentage(productId, val)}
					>
						<NumberInputField />
						<NumberInputStepper>
							<NumberIncrementStepper />
							<NumberDecrementStepper />
						</NumberInputStepper>
					</NumberInput>
				</FormControl>
			</div>
		</>
	);
}

export default OtherTaxLawForm;