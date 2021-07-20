import {
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper
} from '@chakra-ui/react';

interface IMinWageLawForm {
  setAmount: (value: number) => void,
}

const MinWageLawForm: React.FC<IMinWageLawForm> = ({ setAmount }) => {
  return (
    <div className='mt-2'>
      <FormControl>
        <FormLabel>Wage:</FormLabel>
        <NumberInput
          className='border border-white border-opacity-25 rounded shadow-md'
          min={0.01}
          step={0.01}
          onChange={(_, val) => setAmount(val)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
    </div>
  );
}

export default MinWageLawForm;