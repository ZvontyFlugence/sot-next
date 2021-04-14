import { IJobOffer } from '@/models/Company';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Input, InputGroup, InputLeftAddon } from '@chakra-ui/input';
import { List, ListItem } from '@chakra-ui/layout';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { parseCookies } from 'nookies';
import { useToast } from '@chakra-ui/toast';
import { refreshData } from '@/util/ui';
import { useRouter } from 'next/router';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';

interface IManageJobOffers {
  jobOffers: IJobOffer[],
  company_id: number,
  currency: string,
}

const ManageJobOffers: React.FC<IManageJobOffers> = ({ jobOffers, company_id, currency }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wage, setWage] = useState(1.00);

  const mutation = useMutation(() => {
    let payload = {
      action: 'create_job',
      data: {
        company_id: company_id,
        offer: { title, quantity, wage },
      }
    };

    return fetch('/api/companies/doAction', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${cookies.token}`,
      },
      body: JSON.stringify(payload),
    }).then(res => res.json());
  }, {
    onSuccess: (data) => {
      if (data.success) {
        toast({
          position: 'top-right',
          title: 'Job Offer Created',
          status: 'success',
          duration: 2500,
          isClosable: true,
        });
        refreshData(router);
      } else {
        toast({
          position: 'top-right',
          title: 'Create Job Offer Failed',
          description: data.error,
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      }
    },
    onError: (e) => {
      toast({
        position: 'top-right',
        title: 'Create Job Offer Failed',
        description: e,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  });

  const createJobOffer = () => {
    mutation.mutate();
  }

  return (
    <div className='bg-red flex flex-col'>
      <div className='flex justify-end'>
        <Button variant='solid' colorScheme='green' onClick={onOpen}>Create Job Offer</Button>
      </div>
      {(!jobOffers || jobOffers.length === 0) ? (
        <p>Company has no job offers.</p>
      ) : (
        <div>
          <p className='text-xl font-semibold text-center mb-4'>Active Offers</p>
          <Table>
            <Thead>
              <Tr>
                <Th>Position Title</Th>
                <Th>Available Positions</Th>
                <Th>Position Wage</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {jobOffers.map((offer, i) => (
                <Tr key={i}>
                  <Td>{offer.title}</Td>
                  <Td>{offer.quantity}</Td>
                  <Td>{offer.wage.toFixed(2)} {currency}</Td>
                  <Td className='flex gap-4'>
                    <Button variant='solid' colorScheme='blue'>Edit</Button>
                    <Button variant='solid' colorScheme='red'>Delete</Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Job Offer</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
              <FormControl>
                <FormLabel>Job Title</FormLabel>
                <Input type='text' onChange={e => setTitle(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Available Positions</FormLabel>
                <Input type='number' min={1} onChange={e => setQuantity(e.target.valueAsNumber)} />
              </FormControl>
              <FormControl>
                <FormLabel>Position Wage</FormLabel>
                <InputGroup>
                  <InputLeftAddon children={currency} />
                  <Input type='number' value={wage.toFixed(2)} min={1.00} step={0.01} onChange={e => setWage(e.target.valueAsNumber)} />
                </InputGroup>
              </FormControl>
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='green' onClick={createJobOffer}>Create</Button>
            <Button variant='outline' onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default ManageJobOffers;