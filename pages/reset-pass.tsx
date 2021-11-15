import Nav from '@/components/Nav';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Box, Center, Container } from '@chakra-ui/layout';
import { useToast } from '@chakra-ui/toast';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/util/auth';
import { GetServerSideProps } from 'next';
import { IUser } from '@/models/User';
import { request, showToast } from '@/util/ui';
import ForgotPassRequest, { IForgotPassRequest } from '@/models/ForgotPassRequest';
import { useRouter } from 'next/router';

interface IResetPassProps {
    user: IUser;
    isAuthenticated: boolean;
    requestId: string;
    email: string;
}

export default function ResetPass({ requestId, email, ...props }: IResetPassProps) {
    const router = useRouter();
    const toast = useToast();
    const [pass, setPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isValid, setIsValid] = useState(false);

    // TODO: Introduce Password Length Requirements
    useEffect(() => {
        setIsValid(pass && confirm && pass === confirm);
    }, [pass, confirm]);

    const resetPass = () => {
        request({
            url: '/api/auth/reset-pass',
            method: 'POST',
            payload: { requestId, email, pass }
        }).then(data => {
            if (data.success) {
                showToast(toast, 'success', data?.message);
                router.push('/login');
            } else {
                showToast(toast, 'error', 'Failed to Reset Password', data?.error);
            }
        })
    }

    return (
        <div className='h-full w-full overflow-hidden'>
            <Nav />
            <Center h='75vh' w='100%' className='px-4 md:px-0'>
                <Container className='bg-night pb-4 rounded text-white'>
                    <h1 className='text-2xl text-center font-bold mb-4 mt-8'>Reset Password</h1>
                    <Box>
                        <FormControl className='mb-4' isRequired>
                            <FormLabel>New Password</FormLabel>
                            <Input type='password' onChange={e => setPass(e.target.value)} />
                        </FormControl>
                        <FormControl className='mb-4' isRequired>
                            <FormLabel>Confirm New Password</FormLabel>
                            <Input type='password' onChange={e => setConfirm(e.target.value)} />
                        </FormControl>
                        <FormControl className='flex justify-center'>
                            <Button
                                disabled={!isValid}
                                variant='outline'
                                color='accent-alt'
                                borderColor='accent-alt'
                                _hover={{ bg: 'accent-alt', color: 'white' }}
                                w='50%'
                                onClick={resetPass}
                            >
                                Reset Password
                            </Button>
                        </FormControl>
                    </Box>
                </Container>
            </Center>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ctx => {
    const { req, query } = ctx;

    let result = await getCurrentUser(req);

    if (result.isAuthenticated) {
        return {
            redirect: {
                permanent: false,
                destination: '/dashboard',
            },
        };
    }

    let forgotPassRequest: IForgotPassRequest = await ForgotPassRequest.findOne({})
        .where({ code: query?.code as string })
        .exec();

    if (!forgotPassRequest) {
        return {
            redirect: {
                permanent: false,
                destination: '/login',
            },
        };
    }

    return {
        props: {
            ...result,
            requestId: forgotPassRequest._id.toHexString(),
            email: forgotPassRequest.user
        },
    };
}