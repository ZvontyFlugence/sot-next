import { ICompany, IProductOffer } from "@/models/Company";
import { IUser } from "@/models/User";
import { refreshData, request, showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { Grid, GridItem } from "@chakra-ui/layout";
import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { useMutation, useQueryClient } from 'react-query';
import { parseCookies } from 'nookies';
import Card from "../Card";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { ITEMS } from "@/util/constants";
import { useDisclosure } from "@chakra-ui/hooks";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import React, { useState } from "react";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";

interface ICompDetails {
  company: ICompany,
  currency: string,
  user: IUser,
}

const CompanyDetails: React.FC<ICompDetails> = ({ user, company, currency }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState<IProductOffer>(null);
  const [quantity, setQuantity] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();

  let canApplyForJob: boolean = user.job > 0 && user._id !== company.ceo;

  const hireMutation = useMutation(async ({ job_id }) => {
    let payload = { action: 'apply_job', data: { company_id: company.id, job_id } };

    let data = await request({
      url: '/api/me/doActions',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onMutate: ({ job_id }: { job_id: string }) => {},
    onSuccess: () => {
      showToast(toast, 'success', 'Job Application Successful');
      refreshData(router);
    },
    onError: () => {
      showToast(toast, 'error', 'Failed to Send Application');
    },
  });

  const applyForJob = (job_id: string) => {
    hireMutation.mutate({ job_id });
  }

  const handleOpen = (offer: IProductOffer) => {
    setSelected(offer);
    onOpen();
  }

  const handleClose = () => {
    onClose();
    setSelected(null);
  }

  const purchaseMutation = useMutation(async () => {
    let payload = { action: 'buy_item', data: { company_id: company._id, offer_id: selected?.id, quantity } };
    let data = await request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onSuccess: (data) => {
      showToast(toast, 'success', 'Successful Purchase', data?.message);
      queryClient.invalidateQueries('getWalletInfo');
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Purchase Failed', e.message);
    },
  });

  const handlePurchase = () => {
    purchaseMutation.mutate();
  }

  return (
    <div className='w-full'>
      <Grid templateColumns='repeat(2, 1fr)' gap={12}>
        <GridItem>
          <Card>
            <Card.Header className='text-xl font-semibold text-accent h-brand'>Product Offers</Card.Header>
            <Card.Content className='text-white'>
              {company.productOffers.length === 0 ? (
                <p>Company has no product offers</p>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th color='white'>Product</Th>
                      <Th color='white'>Quantity</Th>
                      <Th color='white'>Price</Th>
                      <Th color='white'>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {company.productOffers.map((offer, i) => (
                      <Tr key={i}>
                        <Td><i className={ITEMS[offer.product_id].image} /> {ITEMS[offer.product_id].name}</Td>
                        <Td>{offer.quantity}</Td>
                        <Td>{offer.price.toFixed(2)} {currency}</Td>
                        <Td>
                          <Button variant='solid' colorScheme='blue' onClick={() => handleOpen(offer)}>Buy</Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Card.Content>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <Card.Header className='text-xl font-semibold text-accent h-brand'>Job Offers</Card.Header>
            <Card.Content className='text-white'>
              {company.jobOffers.length == 0 ? (
                <p>Company has no job offers</p>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th color='white'>Title</Th>
                      <Th color='white'>Positions</Th>
                      <Th color='white'>Wage</Th>
                      <Th color='white'>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {company.jobOffers.length > 0 && company.jobOffers.map((offer, i) => (
                      <Tr key={i}>
                        <Td>{offer.title}</Td>
                        <Td>{offer.quantity}</Td>
                        <Td>{offer.wage.toFixed(2)} {currency}</Td>
                        <Td>
                          <Button
                            size='sm'
                            variant='solid'
                            colorScheme='green'
                            isDisabled={!canApplyForJob}
                            onClick={() => applyForJob(offer.id)}
                          >
                            Apply
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Card.Content>
          </Card>
        </GridItem>
      </Grid>
      {selected && (
        <Modal isOpen={isOpen} onClose={handleClose}>
          <ModalOverlay />
          <ModalContent bgColor='night' color='white'>
            <ModalHeader className='h-brand text-accent'>Buy Product</ModalHeader>
            <ModalCloseButton />
            <ModalBody className='flex flex-col gap-2'>
              <p className='mx-auto'>
                Buy {quantity} <i className={ITEMS[selected.product_id].image} title={ITEMS[selected.product_id].name} /> for {(selected.price * quantity).toFixed(2)} {currency}?
              </p>
              <FormControl>
                <FormLabel>Quantity</FormLabel>
                <Input type='number' value={quantity} min={1} max={selected.quantity} onChange={e => setQuantity(e.target.valueAsNumber)} />
              </FormControl>
            </ModalBody>
            <ModalFooter className='flex gap-2'>
              <Button variant='solid' colorScheme='green' onClick={handlePurchase}>Purchase</Button>
              <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

export default CompanyDetails;