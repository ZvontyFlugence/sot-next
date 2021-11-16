import Nav from "@/components/Nav";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Center, Container } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from "react";
import { setCookie } from 'nookies';
import { getCurrentUser } from '@/util/auth';
import { GetServerSideProps } from "next";
import { request } from "@/util/ui";

export default function Login() {
  const router = useRouter();
  const toast = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = () => {
    request({
      url: 'https://api.ipify.org/?format=json',
      method: 'GET',
    }).then(ipData => {
      request({
        url: '/api/auth/login',
        method: 'POST',
        payload: { email, password, ip: ipData.ip },
      }).then(data => {
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
      });
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
            <div className='flex flex-col items-center justify-center w-full gap-2 mt-2 text-sm'>
              <span>
                Forgot Password?&nbsp;
                <Link href='/forgot-pass'>
                  <a className='text-accent'>Reset Password</a>
                </Link>
              </span>
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
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
    props: {},
  };
}