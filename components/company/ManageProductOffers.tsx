import { IProductOffer } from '@/models/Company';
import { ITEMS } from '@/util/constants';
import { refreshData, request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import { useToast } from '@chakra-ui/toast';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import React, { useState } from 'react';
import { useMutation } from 'react-query';

interface IManageProductOffers {
  productOffers: IProductOffer[],
  company_id: number,
  currency: string,
}

const ManageProductOffers: React.FC<IManageProductOffers> = ({ productOffers, company_id, currency }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState(-1);
  const [productId, setProductId] = useState(-1);
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0.01);

  const { isOpen: isEditOpen, onOpen: onOpenEdit, onClose: onCloseEdit } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  const editProductMutation = useMutation(async (productOffer) => {
    let payload = {
      action: 'edit_product',
      data: { company_id, offer: productOffer },
    };

    let data = await request({
      url: '/api/companies/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error || 'Unknown Error');
    return data;
  }, {
    onMutate: async (productOffer: IProductOffer) => {},
    onSuccess: () => {
      showToast(toast, 'success', 'Product Offer Updated');
      handleClose('edit');
      refreshData(router);
    },
    onError: (e) => {
      showToast(toast, 'error', 'Update Product Offer Failed')
    }
  });

  const deleteProductMutation = useMutation(async ({ productOffer }) => {
    let payload = {
      action: 'delete_product',
      data: { company_id, offer: productOffer },
    };

    let data = await request({
      url: '/api/companies/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onMutate: async ({ productOffer }: { productOffer: IProductOffer }) => {},
    onSuccess: () => {
      showToast(toast, 'success', 'Product Offer Revoked');
      handleClose('delete');
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Failed to Delete Product Offer', e.message);
    },
  });

  const editProductOffer = () => {
    let id = productOffers[selected]?.id;
    editProductMutation.mutate({ id, product_id: productId, quantity, price });
  }

  const deleteProductOffer = () => {
    let offer = productOffers[selected];
    deleteProductMutation.mutate({ productOffer: offer });
  }

  const handleOpen = (index: number, modal: string) => {
    setSelected(index);
    switch (modal.toLowerCase()) {
      case 'edit': {
        onOpenEdit();
        return;
      }
      case 'delete': {
        onOpenDelete();
        return;
      }
      default: {
        setSelected(-1);
        return;
      }
    }
  }

  const handleClose = (modal: string) => {
    setSelected(-1);
    switch (modal.toLowerCase()) {
      case 'edit': {
        onCloseEdit();
        return;
      }
      case 'delete': {
        onCloseDelete();
        return;
      }
      default: {
        return;
      }
    }
  }
  
  return (
    <div className='flex flex-col'>
      {!productOffers || productOffers.length === 0 ? (
        <p>Company has no product offers</p>
      ) : (
        <>
          <p className='text-xl font-semibold text-center h-brand text-accent'>Active Offers</p>
          <div className='hidden md:block'>
            <Table>
              <Thead>
                <Tr>
                  <Th color='white'>Item</Th>
                  <Th color='white'>Quantity</Th>
                  <Th color='white'>Price</Th>
                  <Th color='white'>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {productOffers.map((offer: IProductOffer, i: number) => (
                  <Tr key={i}>
                    <Td><i className={ITEMS[offer.product_id].image} /> {ITEMS[offer.product_id].name}</Td>
                    <Td>{offer.quantity}</Td>
                    <Td>{offer.price.toFixed(2)} {currency}</Td>
                    <Td className='flex gap-4'>
                      <Button variant='solid' colorScheme='blue' onClick={() => handleOpen(i, 'edit')}>Edit</Button>
                      <Button variant='solid' colorScheme='red' onClick={() => handleOpen(i, 'delete')}>Delete</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
          <div className='flex md:hidden flex-col items-center gap-4'>
            {productOffers.map((offer: IProductOffer, i: number) => (
              <div key={i} className='flex items-center w-full'>
                <div className='flex flex-col flex-grow'>
                  <span className='text-base'>
                    <i className={ITEMS[offer.product_id].image} /> &nbsp;
                    {ITEMS[offer.product_id].name}
                  </span>
                  <span>Quantity: {offer.quantity}</span>
                </div>
                <div className='flex-grow'>
                  <span>{offer.price.toFixed(2)} {currency}</span>
                </div>
                <div className='flex flex-col justify-center items-center gap-2'>
                  <Button size='sm' colorScheme='blue' onClick={() => handleOpen(i, 'edit')}>Edit</Button>
                  <Button size='sm' colorScheme='red' onClick={() => handleOpen(i, 'delete')}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TODO: Edit Product Offer Modal */}
      <Modal isOpen={isEditOpen} onClose={() => handleClose('edit')}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Create Product Offer</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
            <FormControl>
              <FormLabel>Quantity</FormLabel>
              <Input type='number' defaultValue={productOffers[selected]?.quantity} onChange={e => setQuantity(e.target.valueAsNumber)} />
            </FormControl>
            <FormControl>
              <FormLabel>Price Per Unit</FormLabel>
              <Input type='number' defaultValue={productOffers[selected]?.price.toFixed(2)} min={0.01} step={0.01} onChange={e => setPrice(e.target.valueAsNumber)} /> 
            </FormControl>
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='blue' onClick={editProductOffer}>Update</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={() => handleClose('edit')}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Product Offer Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => handleClose('delete')}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Create Product Offer</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
            <p>Are you sure you want to delete this product offer?</p>
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='red' onClick={deleteProductOffer}>Delete</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={() => handleClose('delete')}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default ManageProductOffers;