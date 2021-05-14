import { IUser } from "@/models/User";
import { Button, IconButton, Slider, SliderFilledTrack, SliderThumb, SliderTrack, useToast } from '@chakra-ui/react'
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import Inventory from "../shared/Inventory";
import { useState } from "react";
import { IItem } from "@/util/apiHelpers";
import { ITEMS } from "@/util/constants";
import { TimeIcon } from "@chakra-ui/icons";
import { IoCloseSharp } from "react-icons/io5";
import { UserActions } from "@/util/actions";
import { parseCookies } from "nookies";
import { refreshData, request, showToast } from "@/util/ui";
import { useRouter } from "next/router";

interface IGiftModal {
  user: IUser,
  profile: IUser,
  isOpen: boolean,
  onClose: () => void,
}

const GiftModal: React.FC<IGiftModal> = ({ user, profile, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<IItem[]>([]);

  const handleGift = () => {
    let payload = {
      action: UserActions.GIFT,
      data: { profile_id: profile._id, items: selected },
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
        handleClose();
      } else {
        showToast(toast, 'error', 'Gift Items Failed', data?.error);
      }
    });
  }

  const handleSelect = (item: IItem) => {
    setSelected(prev => {
      let idx = prev.findIndex(i => i.item_id === item.item_id);
      if (idx === -1)
        return [...prev, { ...item, quantity: 1 }];

      return [...prev];
    });
  }

  const handleUnselect = (idx: number) => {
    setSelected(prev => {
      prev.splice(idx, 1);
      return [...prev];
    });
  }

  const updateItem = (idx: number, val: number) => {
    setSelected(prev => {
      if (prev[idx]) {
        let item = prev.splice(idx, 1);
        return [...prev, { ...item[0], quantity: val }];
      }
      return [...prev];
    });
  }

  const handleClose = () => {
    setSelected([]);
    props.onClose();
  }

  return (
    <Modal size='2xl' isOpen={props.isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bgColor='night' color='white'>
        <ModalHeader className='h-brand text-accent'>Gift Items</ModalHeader>
        <ModalCloseButton />
        <ModalBody className='flex flex-col gap-2'>
          <p className='h-brand'>Your Inventory:</p>
          <Inventory inventory={user.inventory} setSelected={item => handleSelect(item)} />
          <p className='h-brand'>Items to Gift</p>
          {selected.length > 0 ? (
            <div className='flex flex-col gap-2'>
              {selected.map((item, i) => {
                let max = user.inventory.find(itm => itm.item_id === item.item_id)?.quantity;

                return (
                  <div key={i} className='flex items-center gap-2'>
                    <i className={ITEMS[item.item_id].image} />
                    {ITEMS[item.item_id].name}
                    <div className='px-4 w-full'>
                      <Slider
                        colorScheme='blue'
                        min={1}
                        max={max || 4}
                        step={1}
                        defaultValue={item.quantity}
                        onChangeEnd={val => updateItem(i, val)}  
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </div>
                    <span className='pr-2'>{item.quantity}</span>
                    <IconButton
                      aria-label='Remove Item'
                      size='sm'
                      variant='solid'
                      colorScheme='red'
                      icon={<IoCloseSharp />}
                      onClick={() => handleUnselect(i)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No items selected</p>
          )}
        </ModalBody>
        <ModalFooter className='flex gap-4'>
          <Button variant='solid' colorScheme='green' onClick={handleGift}>Gift Items</Button>
          <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default GiftModal;