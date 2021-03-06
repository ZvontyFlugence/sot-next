import Nav from "@/components/Nav";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Center, Container } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from "react";
import { useMutation, UseMutationResult } from 'react-query';
import { setCookie } from 'nookies';
import { getCurrentUser } from '@/util/auth';
import { IUser } from "@/models/User";

interface ILoginProps {
  user: IUser,
  isAuthenticated: boolean
}

export default function Login(props: ILoginProps) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation: UseMutationResult<any, Object> = useMutation(formData => {
    return fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(formData) })
      .then(res => res.json());
  }, {
    onSuccess: (data) => {
      if (data.success) {
        setCookie(null, 'token', data.token, { maxAge: 60 * 60 * 24 * 7, path: '/' });
        router.push('/dashboard');
      } else {
        toast({
          position: 'top-right',
          title: 'Login Error',
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
        title: 'Login Error',
        description: e,
        status: 'error',
        duration: 2500,
        isClosable: true,
      });
    }
  });

  const login = () => {
    fetch('https://api.ipify.org/?format=json')
      .then(res => res.json())
      .then(data => {
        mutation.mutate({ email, password, ip: data.ip });
      });
  }

  return (
    <div className='h-full w-full overflow-hidden'>
      <Nav />
      <Center h='75vh' w='100%' className='px-4 md:px-0'>
        <Container className='bg-night pb-4 rounded text-white'>
          <h1 className='text-2xl text-center font-bold mb-4 mt-8'>Login</h1>
          <Box>
            <FormControl className='mb-4' isRequired>
              <FormLabel>Email</FormLabel>
              <Input type='text' onChange={e => setEmail(e.target.value)} />
            </FormControl>
            <FormControl className='mb-4' isRequired>
              <FormLabel>Password</FormLabel>
              <Input type='password' onChange={e => setPassword(e.target.value)} />
            </FormControl>
            <FormControl className='flex justify-center'>
              <Button variant='outline' color='accent-alt' borderColor='accent-alt' _hover={{ bg: 'accent-alt', color: 'white' }} w='50%' onClick={login}>
                Login
              </Button>
            </FormControl>
            <div className='flex justify-center w-full mt-2 text-sm'>
              <span>
                Don't have an account?&nbsp;
                <Link href='/register'>
                  <a className='text-accent'>Register</a>
                </Link>
              </span>
            </div>
          </Box>
        </Container>
      </Center>
    </div>
  );
}

export const getServerSideProps = async (ctx) => {
  const { req } = ctx;

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
    props: { ...result },
  };
}