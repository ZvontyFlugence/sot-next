import { IUser } from "@/models/User";
import Layout from '@/components/Layout';
import React, { useState } from "react";
import { getCurrentUser } from "@/util/auth";
import { destroyCookie, parseCookies } from "nookies";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Button } from "@chakra-ui/button";
import { UserActions } from "@/util/actions";
import { refreshData, request, showToast } from "@/util/ui";
import { useRouter } from "next/router";
import { useToast } from "@chakra-ui/toast";
import { GetServerSideProps } from "next";
import { useUser } from "@/context/UserContext";

const CreateNewspaper: React.FC = () => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const user = useUser();
  
  const [name, setName] = useState('');
  const hasSufficientFunds = (user && user.gold > 5.0) || false;

  const handleCreateNewspaper = () => {
    let payload = { action: UserActions.CREATE_NEWS, data: { name } };
    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
        router.push(`/newspaper/${data?.newspaper}`);
      } else {
        showToast(toast, 'error', 'Error', data?.error);
      }
    });
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl text-accent'>Create Newspaper</h1>
      <div className='flex flex-col items-center justify-center gap-8'>
        <div className='px-4 py-2 rounded shadow-md bg-blue-300 bg-opacity-50'>
          <span className='text-white'>You do not own a newspaper</span>
        </div>
        <div className='flex flex-col items-center gap-2 px-4 py-2 bg-night rounded shadow-md text-white'>
          <FormControl>
            <FormLabel>Newspaper Name</FormLabel>
            <Input type='text' value={name} onChange={e => setName(e.target.value)} />
          </FormControl>
          <p>Cost: 5.00 <i className='sot-icon sot-coin' /></p>
          <Button
            size='sm'
            variant='solid'
            colorScheme={hasSufficientFunds ? 'green' : 'red'}
            disabled={!hasSufficientFunds}
            onClick={handleCreateNewspaper}
          >
            Create Newspaper
          </Button>
        </div>
      </div>
    </Layout>
  ) : null;
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

export default CreateNewspaper;