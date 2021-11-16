import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { useUser } from '@/context/UserContext';
import { ICompany } from '@/models/Company';
import { getCurrentUser } from '@/util/auth';
import { COMPANY_TYPES } from '@/util/constants';
import { request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Image } from '@chakra-ui/image';
import { Input } from '@chakra-ui/input';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import { Spinner } from '@chakra-ui/spinner';
import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import { useToast } from '@chakra-ui/toast';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

interface IMyCompsResponse {
  companies?: ICompany[],
  error?: string,
}

interface ICreateCompParams {
  name: string,
  type: number,
}

export const getUserCompaniesFetcher = (url: string, token: string) => request({ url, method: 'GET', token });

export default function Companies() {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const user = useUser();
  const { mutate } = useSWRConfig();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [name, setName] = useState('');
  const [type, setType] = useState(0);

  const { data, error } = useSWR(['/api/me/companies', cookies.token], getUserCompaniesFetcher);

  const handleCreateComp = () => {
    if (user.gold >= 25 && type !== 0 && name) {
      request({
        url: '/api/companies',
        method: 'POST',
        payload: { name, type },
        token: cookies.token,
      }).then(data => {
        if (data.success) {
          showToast(toast, 'success', 'Company Created');
          onClose();
          mutate('/api/me/companies');
          router.push(`/company/${data.company_id}`);
        } else {
          showToast(toast, 'error', 'Company Creation Error', data?.error);
        }
      });
    } else {
      showToast(toast, 'error', 'Create Company Failed', 'Insufficient Funds');
    }
  }

  return (
    <>
    <Layout user={user}>
      <h1 className='text-2xl font-semibold pl-4 text-accent'>My Companies</h1>
      <div className='hidden md:block mt-4 mx-12 bg-night shadow-md rounded text-white'>
        {!data && !error && <Spinner color='accent' size='xl' />}
        {(data && !error) && (
          <Table variant='unstyled' size='md'>
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
                      <i className={COMPANY_TYPES[comp._doc.type].css} />
                      <span className='ml-2'>{COMPANY_TYPES[comp._doc.type].text}</span>
                    </Td>
                    <Td>
                      <span>{comp.location_info?.region_name}</span>,&nbsp;
                      <span>{comp.location_info?.owner_name}</span>
                      <span className={`ml-4 flag-icon flag-icon-${comp.location_info?.owner_flag} rounded shadow-md`}></span>
                    </Td>
                  </Tr>
                ))
              }
            </Tbody>
          </Table>
        )}
      </div>
      <div className='flex md:hidden flex-col justify-center items-stretch mt-4 mx-2'>
        {!data && !error && <Spinner color='accent' size='xl' />}
        {(data && !error) && (
          <>
            <Button
              variant='outline'
              color='accent-alt'
              borderColor='accent-alt'
              _hover={{ bg: 'accent-alt', color: 'white' }}
              onClick={onOpen}
            >
              Create New Company
            </Button>

            <div className='mt-4'>
              {data.companies.map((comp: any) => (
                <div className='flex flex-row items-center cursor-pointer py-2 px-4 bg-night shadow-md rounded text-white' onClick={() => router.push(`/company/${comp._doc._id}`)}>
                  <Image boxSize='50px' src={comp._doc.image} alt='' />
                  <div className='flex flex-col ml-2'>                    
                    <span className='text-lg'>{comp._doc.name}</span>
                    <div className='flex flex-row gap-2'>
                      <p>
                        <span className='mr-2'>{COMPANY_TYPES[comp._doc.type].text}</span>
                        <i className={COMPANY_TYPES[comp._doc.type].css} />
                      </p>
                      <p>
                        <span>{comp.location_info?.region_name}</span>,&nbsp;
                        <span>{comp.location_info?.owner_name}</span>
                        <span className={`ml-4 flag-icon flag-icon-${comp.location_info?.owner_flag} rounded shadow-md`}></span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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
          <p className='mt-2 text-center'>Cost 25.00 <i className='sot-icon sot-coin' /></p>
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

export const getServerSideProps: GetServerSideProps = async ctx => {
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
    props: {},
  };
}