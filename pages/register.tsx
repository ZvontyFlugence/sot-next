import Nav from '@/components/Nav';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Box, Center, Container } from '@chakra-ui/layout';
import { useToast } from '@chakra-ui/toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/util/auth';
import { request } from '@/util/ui';
import Select from '@/components/Select';
import { ICountry } from '@/models/Country';
import { GetServerSideProps } from 'next';

interface IRegForm {
  email: string,
  username: string,
  password: string,
  country: number,
}

export default function Register() {
  const router = useRouter();
  const toast = useToast();

  const [countries, setCountries] = useState<ICountry[]>([]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [country, setCountry] = useState(0);

  useEffect(() => {
    request({
      url: '/api/countries',
      method: 'GET',
    }).then(data => {
      if (data?.countries) {
        setCountries(data.countries);
      }
    });
  }, []);

  const register = () => {
    request({
      url: '/api/users',
      method: 'POST',
      payload: { email, username, password, country },
    }).then(data => {
      if (data.success) {
        router.push('/login');
      } else {
        toast({
          position: 'top-right',
          title: 'Registration Error',
          description: data.error,
          status: 'error',
          duration: 2500,
          isClosable: true,
        });
      }
    });
  }

  return (
    <div className='h-full w-full overflow-hidden'>
      <Nav />
      <Center h='100vh' w='100%' className='px-4 md:px-0'>
        <Container className='bg-night pb-4 rounded text-white -mt-24'>
          <h1 className='text-2xl text-center font-bold mb-4 mt-8'>Register</h1>
          <Box>
            <FormControl className='mb-4' isRequired>
              <FormLabel>Email</FormLabel>
              <Input type='email' onChange={e => setEmail(e.target.value)} />
            </FormControl>
            <FormControl className='mb-4' isRequired>
              <FormLabel>Username</FormLabel>
              <Input type='text' onChange={e => setUsername(e.target.value)} />
            </FormControl>
            <FormControl className='mb-4' isRequired>
              <FormLabel>Password</FormLabel>
              <Input type='password' onChange={e => setPassword(e.target.value)} />
            </FormControl>
            <FormControl className='mb-4' isRequired isInvalid={confirm !== password}>
              <FormLabel>Confirm Password</FormLabel>
              <Input type='password' onChange={e => setConfirm(e.target.value)} />
            </FormControl>
            <FormControl className='mb-4' isRequired>
              <FormLabel>Country</FormLabel>
              <Select className='border border-white border-opacity-25 rounded shadow-md' onChange={value => setCountry(value as number)}>
                <Select.Option disabled value={0}>Select Country</Select.Option>
                {countries.map((c: ICountry, i: number) => (
                  <Select.Option key={i} value={c._id}>
                    {c.name}
                    <i className={`ml-2 flag-icon flag-icon-${c.flag_code} rounded shadow-md`} title={c.name} />
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
            <FormControl className='flex justify-center'>
              <Button variant='outline' color='accent-alt' borderColor='accent-alt' _hover={{ bg: 'accent-alt', color: 'white' }} w='50%' onClick={register}>
                Register
              </Button>
            </FormControl>
            <div className='flex justify-center w-full mt-2 text-sm'>
              <span>
                Already have an account?&nbsp;
                <Link href='/login'>
                  <a className='text-accent'>Login</a>
                </Link>
              </span>
            </div>
          </Box>
        </Container>
      </Center>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (result.isAuthenticated) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  return {
    props: {}
  }
}