import { IUser, IWalletItem } from "@/models/User";
import { UserActions } from "@/util/actions";
import { refreshData, request, showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useState } from "react";
import Select from "../Select";

interface IDonateModal {
  user: IUser,
  profile: IUser,
  isOpen: boolean,
  onClose: () => void,
}

const DonateModal: React.FC<IDonateModal> = ({ user, profile, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [gold, setGold] = useState(0);
  const [ccIdx, setCCIdx] = useState(-1);
  const [amount, setAmount] = useState(0);

  const handleClose = () => {
    setGold(0);
    setCCIdx(-1);
    setAmount(0);
    props.onClose();
  }

  const handleDonate = () => {
    let payload = {
      action: UserActions.DONATE,
      data: {
        profile_id: profile._id,
        gold: gold > 0 ? gold : undefined,
        funds: ccIdx > -1 && amount > 0 ? {
          currency: user.wallet[ccIdx].currency,
          amount
        } : undefined,
      },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
        props.onClose();
      } else {
        showToast(toast, 'error', 'Donation Failed', data?.error);
      }
    });
  }

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Donate Funds</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
          {ccIdx > -1 && amount > 0 && gold > 0 ? (
              <p>
                Donate {gold.toFixed(2)} Gold and {amount.toFixed(2)} {user.wallet[ccIdx]?.currency}?
              </p>
            ) : ccIdx > -1 && amount > 0 ? (
              <p>
                Donate {amount.toFixed(2)} {user.wallet[ccIdx]?.currency}?
              </p>
            ) : gold > 0 && (
              <p>
                Donate {gold.toFixed(2)} Gold?
              </p>
            )}
            <FormControl>
              <FormLabel>Gold</FormLabel>
              <Input type='number' min={0} max={user.gold} step={0.01} value={gold.toFixed(2)} onChange={e => setGold(e.target.valueAsNumber)} />
            </FormControl>
            <FormControl>
              <FormLabel>Currency</FormLabel>
              <Select className='border border-white rounded' onChange={val => setCCIdx(val as number)}>
                <Select.Option value={-1} disabled>Select Currency</Select.Option>
                {user.wallet.map((cc: IWalletItem, i: number) => (
                  <Select.Option key={i} value={i}>{cc.currency}</Select.Option>
                ))}
              </Select>
            </FormControl>
            {ccIdx > -1 && (
              <FormControl>
                <FormLabel>Currency Amount</FormLabel>
                <Input type='number' min={0} max={user.wallet[ccIdx]?.amount} step={0.01} value={amount.toFixed(2)} onChange={e => setAmount(e.target.valueAsNumber)} />
              </FormControl>
            )}
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='green' isDisabled={amount === 0 && gold === 0} onClick={handleDonate}>Donate Funds</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
}

export default DonateModal;