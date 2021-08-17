import { roundMoney } from '@/util/apiHelpers';
import {
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper
} from '@chakra-ui/react';
import { useState } from 'react';

interface IPrintMoneyLawForm {
  setAmount: (value: number) => void,
}

const PrintMoneyLawForm: React.FC<IPrintMoneyLawForm> = ({ setAmount }) => {
  const [cost, setCost] = useState<number>(() => {
    return roundMoney(0.01 * 0.005);
  });

  const updateAmount = (val: number) => {
    setAmount(val);
    setCost(() => roundMoney(val * 0.005));
  }

  return (
    <div className='mt-2'>
      <FormControl>
        <FormLabel>Amount:</FormLabel>
        <NumberInput
          className='border border-white border-opacity-25 rounded shadow-md'
          min={0.01}
          step={0.01}
          onChange={(_, val) => updateAmount(val)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
      <span>Cost: {cost.toFixed(2)} <i className='sot-icon sot-coin' /></span>
    </div>
  );
}

export default PrintMoneyLawForm;