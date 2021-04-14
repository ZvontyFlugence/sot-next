import Layout from "@/components/Layout";
import { ICompany } from "@/models/Company";
import { IUser } from "@/models/User";
import { getCurrentUser } from "@/util/auth";
import { COMPANY_TYPES } from "@/util/constants";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { useDisclosure } from "@chakra-ui/hooks";
import { Image } from "@chakra-ui/image";
import { Input } from "@chakra-ui/input";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import { Select } from "@chakra-ui/select";
import { Spinner } from "@chakra-ui/spinner";
import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from 'nookies';
import { useState } from "react";
import { useQuery, useMutation, UseMutationResult } from 'react-query';

interface IMyCompaniesProps {
  user: IUser,
  isAuthenticated: boolean
}

interface IMyCompsResponse {
  companies?: ICompany[],
  error?: string,
}

export default function Companies({ user, ...props }: IMyCompaniesProps) {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

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

  const mutation: UseMutationResult<any, Object> = useMutation('createCompany', formData => {
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
      mutation.mutate({ name, type });
    }
  }

  return (
    <>
    <Layout user={user}>
      <h1 className='text-2xl font-semibold pl-4'>My Companies</h1>
      <div className='mt-4 mx-12 bg-white shadow-md rounded-lg border border-solid border-black border-opacity-25'>
        {isLoading && <Spinner color='red.500' size='xl' />}
        {(!isLoading && !isError) && (
          <Table variant='simple' size='md'>
            <TableCaption>
              <Button variant='outline' colorScheme='blue' onClick={onOpen}>Create New Company</Button>
            </TableCaption>
            <Thead>
              <Tr>
                <Th>Company</Th>
                <Th>Type</Th>
                <Th>Location</Th>
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
      <ModalContent>
        <ModalHeader>Create Company</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Company Name</FormLabel>
            <Input type='text' onChange={e => setName(e.target.value)} />
          </FormControl>
          <FormControl className='mt-2'>
            <FormLabel>Company Type</FormLabel>
            <Select placeholder='Select Company Type' onChange={e => setType(Number.parseInt(e.target.value))}>
              {COMPANY_TYPES.map(comp_type => (
                <option key={comp_type.css} value={comp_type.item}>{comp_type.text}</option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant='solid' colorScheme='green' onClick={handleCreateComp}>Create</Button>
          <Button className='ml-4' variant='outline' colorScheme='blackAlpha' onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
}

export const getServerSideProps = async ctx => {
  let { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    res.writeHead(302, {
      Location: '/login',
    });
    res.end();
    return;
  }

  return {
    props: { ...result },
  };
}