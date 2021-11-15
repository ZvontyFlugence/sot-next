import { IItem } from '@/util/apiHelpers';
import { ITEMS } from '@/util/constants';
import { refreshData, request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import { useToast } from '@chakra-ui/toast';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import React, { useState } from 'react';
import Inventory from '../shared/Inventory';

interface IManageInventory {
  inventory: IItem[],
  company_id: number,
  currency: string,
}

const ManageInventory: React.FC<IManageInventory> = ({ inventory, company_id, currency }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<IItem>(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0.01);
  const { isOpen: isCreateOpen, onOpen: onOpenCreate, onClose: onCloseCreate } = useDisclosure();

  const createProductOffer = () => {
    let payload = {
      action: 'create_product',
      data: {
        company_id,
        offer: { product_id: selected?.item_id, quantity, price },
      }
    };

    request({
      url: '/api/companies/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', 'Product Offer Created');
        onCloseCreate();
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Create Product Offer Failed', data?.error);
      }
    });
  }

  const handleCloseCreate = () => {
    setSelected(null);
    setQuantity(1);
    setPrice(0.01);
    onCloseCreate();
  }

  return (
    <>
      <div className='flex justify-end gap-4 mb-2'>
        <Button size='sm' variant='solid' colorScheme='green'>Deposit</Button>
      </div>
      <Inventory inventory={inventory} onSellItem={onOpenCreate} setSelected={setSelected} />
      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Create Product Offer</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
            {selected && (
              <>
                <p className='mx-auto'>
                  Creating Offer for {quantity} <i className={'cursor-pointer ' + ITEMS[selected.item_id].image} title={ITEMS[selected.item_id].name} /> at {price.toFixed(2)} {currency} per unit?
                </p>
                <FormControl>
                  <FormLabel>Quantity</FormLabel>
                  <Input type='number' value={quantity} min={1} max={selected?.quantity || 1} onChange={e => setQuantity(e.target.valueAsNumber)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Price Per Unit</FormLabel>
                  <Input type='number' value={price.toFixed(2)} min={0.01} step={0.01} onChange={e => setPrice(e.target.valueAsNumber)} /> 
                </FormControl>
              </>
            )}
            
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='blue' onClick={createProductOffer}>Create Product Offer</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleCloseCreate}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ManageInventory;