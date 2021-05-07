import { IJobOffer } from '@/models/Company';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Input, InputGroup, InputLeftAddon } from '@chakra-ui/input';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { parseCookies } from 'nookies';
import { useToast } from '@chakra-ui/toast';
import { refreshData, request, showToast } from '@/util/ui';
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
  const { isOpen: isCreateOpen, onOpen: onOpenCreate, onClose: onCloseCreate } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onOpenEdit, onClose: onCloseEdit } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();
  const [selected, setSelected] = useState(-1);
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wage, setWage] = useState(1.00);

  const createJobMutation = useMutation(async () => {
    let payload = {
      action: 'create_job',
      data: {
        company_id,
        offer: { title, quantity, wage },
      }
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
    onSuccess: () => {
      showToast(toast, 'success', 'Job Offer Created');
      onCloseCreate();
      refreshData(router);
    },
    onError: (e) => {
      showToast(toast, 'error', 'Create Job Offer Failed', e as string);
    }
  });

  const editJobMutation = useMutation(async (jobOffer) => {
    let payload = {
      action: 'edit_job',
      data: { company_id, offer: jobOffer },
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
    onMutate: async (jobOffer: IJobOffer) => {},
    onSuccess: () => {
      showToast(toast, 'success', 'Job Offer Updated');
      handleClose('edit');
      refreshData(router);
    },
    onError: (e) => {
      showToast(toast, 'error', 'Update Job Offer Failed', e as string);
    }
  });

  const deleteJobMutation = useMutation(async ({ job_id }) => {
    let payload = { action: 'delete_job', data: { company_id, job_id } };
    
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
    onMutate: async ({ job_id }: { job_id: string }) => {},
    onSuccess: (data) => {
      showToast(toast, 'success', 'Job Offer Revoked');
      handleClose('delete');
      refreshData(router);
    },
    onError: () => {
      showToast(toast, 'error', 'Delete Job Offer Failed');
    },
  });

  const createJobOffer = () => {
    createJobMutation.mutate();
  }

  const editJobOffer = () => {
    let id = jobOffers[selected]?.id;
    editJobMutation.mutate({ id, title, quantity, wage });
  }

  const deleteJobOffer = () => {
    let id = jobOffers[selected]?.id;
    deleteJobMutation.mutate({ job_id: id });
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
      <div className='flex justify-end'>
        <Button variant='solid' colorScheme='green' onClick={onOpenCreate}>Create Job Offer</Button>
      </div>
      {(!jobOffers || jobOffers.length === 0) ? (
        <p>Company has no job offers.</p>
      ) : (
        <div>
          <p className='text-xl font-semibold text-center mb-4 h-brand text-accent'>Active Offers</p>
          <Table>
            <Thead>
              <Tr>
                <Th color='white'>Position Title</Th>
                <Th color='white'>Available Positions</Th>
                <Th color='white'>Position Wage</Th>
                <Th color='white'>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {jobOffers.map((offer, i) => (
                <Tr key={i}>
                  <Td>{offer.title}</Td>
                  <Td>{offer.quantity}</Td>
                  <Td>{offer.wage.toFixed(2)} {currency}</Td>
                  <Td className='flex gap-4'>
                    <Button variant='solid' colorScheme='blue' onClick={() => handleOpen(i, 'edit')}>Edit</Button>
                    <Button variant='solid' colorScheme='red' onClick={() => handleOpen(i, 'delete')}>Delete</Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}

      {/* Create Job Offer Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCloseCreate}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Create Job Offer</ModalHeader>
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
                  <InputLeftAddon bgColor='accent-alt' children={currency} />
                  <Input type='number' value={wage.toFixed(2)} min={1.00} step={0.01} onChange={e => setWage(e.target.valueAsNumber)} />
                </InputGroup>
              </FormControl>
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='green' onClick={createJobOffer}>Create</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={onCloseCreate}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Job Offer Modal */}
      {selected >= 0 && jobOffers.length > 0 && (
        <Modal isOpen={isEditOpen} onClose={() => handleClose('edit')}>
          <ModalOverlay />
          <ModalContent bgColor='night' color='white'>
            <ModalHeader className='h-brand text-accent'>Edit Job Offer</ModalHeader>
            <ModalCloseButton />
            <ModalBody className='flex flex-col gap-2'>
              <FormControl>
                <FormLabel>Job Title</FormLabel>
                <Input type='text' defaultValue={jobOffers[selected]?.title} onChange={e => setTitle(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Available Positions</FormLabel>
                <Input type='number' min={1} defaultValue={jobOffers[selected]?.quantity} onChange={e => setQuantity(e.target.valueAsNumber)} />
              </FormControl>
              <FormControl>
                <FormLabel>Position Wage</FormLabel>
                <InputGroup>
                  <InputLeftAddon bgColor='accent-alt' children={currency} />
                  <Input type='number' defaultValue={jobOffers[selected]?.wage.toFixed(2)} min={1.00} step={0.01} onChange={e => setWage(e.target.valueAsNumber)} />
                </InputGroup>
              </FormControl>
            </ModalBody>
            <ModalFooter className='flex gap-4'>
              <Button variant='solid' colorScheme='blue' onClick={editJobOffer}>Update</Button>
              <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={() => handleClose('edit')}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Job Offer Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => handleClose('delete')}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Delete Job Offer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>
              Are you sure you want to delete this job offer?
            </p>
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='red' onClick={deleteJobOffer}>Delete</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={() => handleClose('delete')}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default ManageJobOffers;