import { IEmployee } from "@/models/Company";
import { IEmployeeInfo } from "@/util/apiHelpers";
import { refreshData, request, showToast } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { useDisclosure } from "@chakra-ui/hooks";
import { Input } from "@chakra-ui/input";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import { Spinner } from "@chakra-ui/spinner";
import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

interface IManageEmployees {
  company_id: number,
  employees: IEmployee[],
  currency: string,
}

const ManageEmployees: React.FC<IManageEmployees> = ({ employees, company_id, ...props }) => {
  const cookies = parseCookies();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<IEmployee>(null);
  const [title, setTitle] = useState('');
  const [wage, setWage] = useState(0);
  const [shouldRefetch, setShouldRefetch] = useState(false);

  const { isOpen: isEditOpen, onOpen: onOpenEdit, onClose: onCloseEdit } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  // Get Employee Info Query
  const { isLoading, isSuccess, data, ...query } = useQuery('getEmployeeInfo', () => {
    let payload = { employees };
    return request({
      url: '/api/companies/employeeInfo',
      method: 'POST',
      payload,
      token: cookies.token,
    });
  });

  useEffect(() => {
    if (shouldRefetch) {
      query.refetch();
      setShouldRefetch(false);
    }
  }, [shouldRefetch]);

  // Employee Mutations
  const editMutation = useMutation(async () => {
    let payload = {
      action: 'edit_employee',
      data: {
        company_id,
        employee: {
          user_id: selected?.user_id,
          title: (title !== selected.title) && (title !== '') ? title : undefined,
          wage: (wage > 0) && (wage !== selected.wage) ? wage : undefined,
        },
      },
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
    onSuccess: (data) => {
      showToast(toast, 'success', data?.message || 'Employee Updated');
      queryClient.invalidateQueries('getEmployeeInfo');
      refreshData(router);
      handleClose();
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Failed to Edit Employee', e.message);
    }
  });

  const fireMutation = useMutation(async () => {
    let payload = { action: 'fire_employee', data: { company_id, employee_id: selected?.user_id } };
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
    onSuccess: (data) => {
      showToast(toast, 'success', data?.message || 'Employee Fired');
      queryClient.invalidateQueries('getEmployeeInfo');
      refreshData(router);
      handleClose();
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Failed to Fire Employee', e.message);
    }
  });

  const handleOpenEdit = (employee: IEmployee) => {
    setSelected(employee);
    onOpenEdit();
  }

  const handleOpenDelete = (employee: IEmployee) => {
    setSelected(employee);
    onOpenDelete();
  }

  const handleClose = () => {
    setSelected(null);
    setShouldRefetch(true);
    if (isEditOpen)
      onCloseEdit();
    else
      onCloseDelete();
  }

  const handleEdit = () => {
    editMutation.mutate();
  }

  const handleFire = () => {
    fireMutation.mutate();
  }

  const canEdit = () => {
    if (!title && wage === 0)
      return false;
    else if (title === selected?.title && wage === selected?.wage)
      return false;
    return true;
  }

  return (
    <div className='flex'>
      {isLoading && (
        <div className='flex justify-center'>
          <Spinner color='accent' size='xl' />
        </div>
      )}
      {employees.length === 0 ? (
        <p>Company doesn't have any employees</p>
      ) : (
        <>
          <div className='hidden md:block'>
            <Table>
              <Thead>
                <Tr>
                  <Th color='white'>Employee</Th>
                  <Th color='white'>Title</Th>
                  <Th color='white'>Wage</Th>
                  <Th color='white'>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isSuccess && data.employeeInfo && data.employeeInfo.map((employee: IEmployeeInfo, i: number) => (
                  <Tr key={i}>
                    <Td className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/profile/${employee.user_id}`)}>
                      <Avatar src={employee.image} name={employee.name} />
                      {employee.name}
                    </Td>
                    <Td>{employee.title}</Td>
                    <Td>{employee.wage.toFixed(2)} {props.currency}</Td>
                    <Td>
                      <div className='flex items-center gap-4'>
                        <Button variant='solid' colorScheme='blue' onClick={() => handleOpenEdit(employee)}>Edit</Button>
                        <Button variant='solid' colorScheme='red' onClick={() => handleOpenDelete(employee)}>Fire</Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
          <div className='flex md:hidden flex-col items-center gap-4 w-full'>
            <h3 className='text-xl font-semibold text-accent h-brand'>Employees</h3>
            {isSuccess && data?.employeeInfo && data?.employeeInfo.map((employee: IEmployeeInfo, i: number) => (
              <div key={i} className='flex items-center gap-2 w-full'>
                <div onClick={() => router.push(`/profile/${employee.user_id}`)}>
                  <Avatar src={employee.image} name={employee.name} />
                </div>
                <div className='flex flex-col gap-2 flex-grow'>
                  <span className='text-base' onClick={() => router.push(`/profile/${employee.user_id}`)}>
                    {employee.name}
                  </span>
                  <span className='ml-2'>{employee.title}</span>
                  <span className='ml-2'>Wage: {employee.wage.toFixed(2)} {props.currency}</span>
                </div>
                <div className='flex flex-col items-center gap-2'>
                  <Button size='sm' colorScheme='blue' onClick={() => handleOpenEdit(employee)}>Edit</Button>
                  <Button size='sm' colorScheme='red' onClick={() => handleOpenDelete(employee)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit Employee Modal */}
      <Modal isOpen={isEditOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Edit Employee</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input type='text' defaultValue={selected?.title} onChange={e => setTitle(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Wage</FormLabel>
              <Input type='number' defaultValue={selected?.wage} min={0.01} step={0.01} onChange={e => setWage(e.target.valueAsNumber)} />
            </FormControl>
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='blue' onClick={handleEdit} isDisabled={!canEdit()}>Edit</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Employee Confirm */}
      <Modal isOpen={isDeleteOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent'>Fire Employee</ModalHeader>
          <ModalCloseButton />
          <ModalBody className='flex flex-col gap-2'>
            <p>Are you sure you want to fire this employee?</p>
          </ModalBody>
          <ModalFooter className='flex gap-4'>
            <Button variant='solid' colorScheme='red' onClick={handleFire}>Fire</Button>
            <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default ManageEmployees;