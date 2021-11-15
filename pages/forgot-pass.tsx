import Nav from '@/components/Nav';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Box, Center, Container } from '@chakra-ui/layout';
import { useToast } from '@chakra-ui/toast';
import { useState } from 'react';
import { getCurrentUser } from '@/util/auth';
import { GetServerSideProps } from 'next';
import { IUser } from '@/models/User';
import { request, showToast } from '@/util/ui';

interface IForgotPassProps {
    user: IUser;
    isAuthenticated: boolean;
}

export default function ForgotPass(_props: IForgotPassProps) {
    const toast = useToast();
    const [email, setEmail] = useState('');

    const getResetPassCode = () => {
        request({
            url: '/api/auth/forgot-pass',
            method: 'POST',
            payload: { email }
        }).then(data => {
            if (data.success) {
                // Show success toast
                showToast(toast, 'success', data?.message);
            } else {
                // Show failure toast
                showToast(toast, 'error', 'Error Sending Email', data?.error);
            }
        });
    }

    return (
        <div className='h-full w-full overflow-hidden'>
            <Nav />
            <Center h='75vh' w='100%' className='px-4 md:px-0'>
                <Container className='bg-night pb-4 rounded text-white'>
                    <h1 className='text-2xl text-center font-bold mb-4 mt-8'>Forgot Password</h1>
                    <Box>
                        <FormControl className='mb-4' isRequired>
                            <FormLabel>Email</FormLabel>
                            <Input type='email' onChange={e => setEmail(e.target.value)} />
                        </FormControl>
                        <FormControl className='flex justify-center'>
                            <Button
                                variant='outline'
                                color='accent-alt'
                                borderColor='accent-alt'
                                _hover={{ bg: 'accent-alt', color: 'white' }}
                                w='50%'
                                onClick={getResetPassCode}
                            >
                                Send Reset Password Email
                            </Button>
                        </FormControl>
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
        props: { ...result },
    };
}