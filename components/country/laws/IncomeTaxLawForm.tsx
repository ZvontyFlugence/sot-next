import {
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';

interface IIncomeTaxLawForm {
  value: number,
  setValue: (val: number) => void;
}

export default function IncomeTaxLawForm({ value, setValue }: IIncomeTaxLawForm) {
  return (
    <div className='mt-2'>
      <FormControl>
        <FormLabel>Percentage:</FormLabel>
        <NumberInput
          className='border border-white border-opacity-25 rounded shadow-md'
          min={0}
          max={100}
          step={1}
          defaultValue={value}
          onChange={(_, val) => setValue(val)}
        >
          <NumberInputField />
          <NumberInputStepper >
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
    </div>
  );
};