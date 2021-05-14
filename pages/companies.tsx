import Layout from "@/components/Layout";
import Select from "@/components/Select";
import { ICompany } from "@/models/Company";
import { IUser } from "@/models/User";
import { getCurrentUser } from "@/util/auth";
import { COMPANY_TYPES } from "@/util/constants";
import { showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { useDisclosure } from "@chakra-ui/hooks";
import { Image } from "@chakra-ui/image";
import { Input } from "@chakra-ui/input";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
// import { Select } from "@chakra-ui/select";
import { Spinner } from "@chakra-ui/spinner";
import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from 'nookies';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from 'react-query';

interface IMyCompaniesProps {
  user: IUser,
  isAuthenticated: boolean
}

interface IMyCompsResponse {
  companies?: ICompany[],
  error?: string,
}

interface ICreateCompParams {
  name: string,
  type: number,
}

export default function Companies({ user, ...props }: IMyCompaniesProps) {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [name, setName] = useState('');
  const [type, setType] = useState(0);

  const { isLoading, isError, data } = useQuery('getUserCompanies', () => {
    return fetch('/api/me/companies', {
      headers: {
        authorization: `Bearer ${cookies.token}`,
      }
    }).then(res => res.json());
  });

  const mutation = useMutation<any, unknown, ICreateCompParams>('createCompany', formData => {
    return fetch('/api/companies', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${cookies.token}`,
      },
      body: JSON.stringify(formData),
    }).then(res => res.json());
  }, {
    onSuccess: (data) => {
      if (data.success) {
        toast({
          position: 'top-right',
          title: 'Company Created',
          status: 'success',
          duration: 2500,
          isClosable: true,
        });
        queryClient.invalidateQueries('getUserCompanies');
        router.push(`/company/${data.company_id}`);
      } else {
        toast({
          position: 'top-right',
          title: 'Company Creation Error',
          description: data.error,
          status: 'error',
          duration: 2500,
          isClosable: true,
        });
      }
    },
    onError: (e) => {
      toast({
        position: 'top-right',
        title: 'Company Creation Error',
        description: e,
        status: 'error',
        duration: 2500,
        isClosable: true,
      });
    },
  });

  const handleCreateComp = () => {
    if (user.gold >= 25 && type !== 0 && name) {
      mutation.mutate({ name, type } as ICreateCompParams);
    } else {
      showToast(toast, 'error', 'Create Company Failed', 'Insufficient Funds');
    }
  }

  return (
    <>
    <Layout user={user}>
      <h1 className='text-2xl font-semibold pl-4 text-accent'>My Companies</h1>
      <div className='mt-4 mx-12 bg-night shadow-md rounded text-white'>
        {isLoading && <Spinner color='accent' size='xl' />}
        {(!isLoading && !isError) && (
          <Table variant='simple' size='md'>
            <TableCaption>
              <Button
                variant='outline'
                color='accent-alt'
                borderColor='accent-alt'
                _hover={{ bg: 'accent-alt', color: 'white' }}
                onClick={onOpen}
              >
                Create New Company
              </Button>
            </TableCaption>
            <Thead>
              <Tr>
                <Th color='white'>Company</Th>
                <Th color='white'>Type</Th>
                <Th color='white'>Location</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.companies.map((comp) => (
                  <Tr className='cursor-pointer' onClick={() => router.push(`/company/${comp._doc._id}`)}>
                    <Td className='flex flex-row items-center'>
                      <Image boxSize='50px' src={comp._doc.image} alt='' />
                      <span className='ml-4 text-lg'>{comp._doc.name}</span>
                    </Td>
                    <Td>
                      <span className='mr-2'>{COMPANY_TYPES[comp._doc.type].text}</span>
                      <i className={COMPANY_TYPES[comp._doc.type].css} />
                    </Td>
                    <Td>
                      <span>{comp.location_info?.region_name}</span>,&nbsp;
                      <span>{comp.location_info?.owner_name}</span>
                      <span className={`ml-4 flag-icon flag-icon-${comp.location_info?.owner_flag}`}></span>
                    </Td>
                  </Tr>
                ))
              }
            </Tbody>
          </Table>
        )}
      </div>
    </Layout>

    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bgColor='night' color='white'>
        <ModalHeader className='h-brand'>Create Company</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Company Name</FormLabel>
            <Input type='text' onChange={e => setName(e.target.value)} />
          </FormControl>
          <FormControl className='mt-2 justify-start'>
            <FormLabel>Company Type</FormLabel>
            <Select className='border border-white rounded w-max' onChange={val => setType(val as number)}>
              {COMPANY_TYPES.map(comp_type => (
                <Select.Option key={comp_type.css} value={comp_type.item}>
                  <div>
                    <i className={`${comp_type.css}`} />
                    &nbsp;
                    <span>{comp_type.text}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant='solid' colorScheme='green' onClick={handleCreateComp}>Create</Button>
          <Button className='ml-4' variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
}

export const getServerSideProps = async ctx => {
  let { req } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  return {
    props: { ...result },
  };
}