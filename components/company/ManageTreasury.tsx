import { IFunds } from '@/models/Company';
import { IUser, IWalletItem } from '@/models/User';
import { ILocationInfo } from '@/util/apiHelpers';
import { refreshData, request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import { Stat, StatGroup, StatLabel, StatNumber } from '@chakra-ui/stat';
import { useToast } from '@chakra-ui/toast';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useState } from 'react';
import Select from '../Select';
import { useSWRConfig } from 'swr';

interface IManageTreasury {
  company_id: number,
  funds: IFunds[],
  gold: number,
  currency: string,
  locationInfo: ILocationInfo,
  user: IUser,
}

const ManageTreasury: React.FC<IManageTreasury> = ({ funds, gold, user, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const { mutate } = useSWRConfig();

  const [transGold, setTransGold] = useState(0.00);
  const [currency, setCurrency] = useState(-1);
  const [amount, setAmount] = useState(0.00);

  const defaultCC = funds.findIndex(cc => cc.currency === props.currency);

  const { isOpen: isDepositOpen, onOpen: onOpenDeposit, onClose: onCloseDeposit } = useDisclosure();
  const { isOpen: isWithdrawOpen, onOpen: onOpenWithdraw, onClose: onCloseWithdraw } = useDisclosure();

  const handleDeposit = () => {
    let payload = {
      action: 'deposit_funds',
      data: {
        company_id: props.company_id,
        gold: transGold > 0 ? transGold : undefined,
        funds: (currency > -1 && amount > 0) ? { currency: user.wallet[currency].currency, amount } : undefined,
      },
    };

    request({
      url: '/api/companies/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', 'Transaction Successful', data?.message);
        mutate('/api/me/wallet-info');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Transaction Failed', data?.error);
      }
    });

    setCurrency(-1);
    setAmount(0);
    setTransGold(0);
    onCloseDeposit();
  }

  const handleWithdraw = () => {
    let payload = {
      action: 'withdraw_funds',
      data: {
        company_id: props.company_id,
        gold: transGold > 0 ? transGold : undefined,
        funds: (currency > -1 && amount > 0) ? { currency: funds[currency].currency, amount } : undefined,
      },
    };

    request({
      url: '/api/companies/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', 'Transaction Successful', data?.message);
        mutate('/api/me/wallet-info');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Transaction Failed', data?.error);
      }
    });

    setCurrency(-1);
    setAmount(0);
    setTransGold(0);
    onCloseWithdraw();
  }

  return (
    <div className='flex flex-col'>
      <div className='flex justify-end gap-4'>
        <Button size='sm' variant='solid' colorScheme='green' onClick={onOpenDeposit}>Deposit</Button>
        <Button size='sm' variant='solid' colorScheme='blue' onClick={onOpenWithdraw}>Withdrawal</Button>
      </div>
      <div className='flex w-full justify-center items-center'>
        <StatGroup className='flex justify-center gap-8 w-1/2'>
          <Stat>
            <StatLabel>Gold</StatLabel>
            <StatNumber>
              <span className='mr-2'>{gold.toFixed(2)}</span>
              <i className='sot-icon sot-coin' />
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>{props.currency}</StatLabel>
            <StatNumber>
              <div className='flex items-center gap-2'>
                <span>{defaultCC > -1 && funds[defaultCC].amount.toFixed(2) || 0.00}</span>
                <span className='sot-flag-wrap'>
                  <i className={`sot-flag sot-flag-${props.locationInfo.owner_flag} h-10`} />
                </span>
              </div>
            </StatNumber>
          </Stat>
        </StatGroup>
      </div>
      {/* Deposit Funds Modal */}
      <Modal isOpen={isDepositOpen} onClose={onCloseDeposit}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Deposit Funds</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
          {currency > -1 && amount > 0 && transGold > 0 ? (
              <p>
                Deposit {transGold.toFixed(2)} Gold and {amount.toFixed(2)} {user.wallet[currency]?.currency}?
              </p>
            ) : currency > -1 && amount > 0 ? (
              <p>
                Deposit {amount.toFixed(2)} {user.wallet[currency]?.currency}?
              </p>
            ) : transGold > 0 && (
              <p>
                Deposit {transGold.toFixed(2)} Gold?
              </p>
            )}
            <FormControl>
              <FormLabel>Gold</FormLabel>
              <Input type='number' min={0} max={user.gold} step={0.01} value={transGold.toFixed(2)} onChange={e => setTransGold(e.target.valueAsNumber)} />
            </FormControl>
            <FormControl>
              <FormLabel>Currency</FormLabel>
              {/* TODO: Fix Select Component Not Updating Selected Value Displayed */}
              <Select className='border border-white rounded' selected={currency} onChange={val => setCurrency(val as number)}>
                {[null].concat(user.wallet).map((cc: IWalletItem, i: number) => (
                  <Select.Option key={i} value={i - 1} disabled={!cc}>{cc ? cc.currency : 'Select Currency'}</Select.Option>
                ))}
              </Select>
            </FormControl>
            {currency > -1 && (
              <FormControl>
                <FormLabel>Currency Amount</FormLabel>
                <Input type='number' min={0} max={user.wallet[currency]?.amount} step={0.01} value={amount.toFixed(2)} onChange={e => setAmount(e.target.valueAsNumber)} />
              </FormControl>
            )}
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='green' isDisabled={amount === 0 && transGold === 0} onClick={handleDeposit}>Deposit Funds</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={onCloseDeposit}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Withdraw Funds Modal */}
      <Modal isOpen={isWithdrawOpen} onClose={onCloseWithdraw}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Withdraw Funds</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
            {currency > -1 && amount > 0 && transGold > 0 ? (
              <p>
                Withdraw {transGold.toFixed(2)} Gold and {amount.toFixed(2)} {funds[currency]?.currency}?
              </p>
            ) : currency > -1 && amount > 0 ? (
              <p>
                Withdraw {amount.toFixed(2)} {funds[currency]?.currency}?
              </p>
            ) : transGold > 0 && (
              <p>
                Withdraw {transGold.toFixed(2)} Gold?
              </p>
            )}
            <FormControl>
              <FormLabel>Gold</FormLabel>
              <Input type='number' min={0} max={gold} step={0.01} value={transGold.toFixed(2)} onChange={e => setTransGold(e.target.valueAsNumber)} />
            </FormControl>
            <FormControl>
              <FormLabel>Currency</FormLabel>
              {/* TODO: Fix Select Component Not Updating Selected Value Displayed */}
              <Select className='border border-white rounded' selected={currency} onChange={val => setCurrency(val as number)}>
                {[null].concat(funds).map((cc: IWalletItem, i: number) => (
                  <Select.Option key={i} value={i - 1} disabled={!cc}>{cc ? cc.currency : 'Select Currency'}</Select.Option>
                ))}
              </Select>
            </FormControl>
            {currency > -1 && (
              <FormControl>
                <FormLabel>Currency Amount</FormLabel>
                <Input type='number' min={0} max={funds[currency]?.amount} step={0.01} value={amount.toFixed(2)} onChange={e => setAmount(e.target.valueAsNumber)} />
              </FormControl>
            )}
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='blue' isDisabled={amount === 0 && transGold === 0} onClick={handleWithdraw}>Withdraw Funds</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={onCloseWithdraw}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default ManageTreasury;