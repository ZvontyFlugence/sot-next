import { IShout } from "@/models/Shout";
import { IUser } from "@/models/User";
import { refreshData, request, showToast } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Button } from "@chakra-ui/button";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { Textarea } from "@chakra-ui/textarea";
import { useToast } from "@chakra-ui/toast";
import { addMinutes, format } from "date-fns";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Card from "../Card";

interface IShouts {
  user: IUser,
}

interface IShoutTab {
  scope: 'global' | 'country' | 'party' | 'unit',
  scope_id: number,
}

const Shouts: React.FC<IShouts> = ({ user }) => {
  const cookies = parseCookies();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<'global' | 'country' | 'party' | 'unit'>('global');
  const [message, setMessage] = useState('');

  const getScopeID = (scope?: string) => {
    switch (scope || tab) {
      case 'country':
        return user.country;
      case 'party':
        return user.party;
      case 'unit':
        return user.unit;
      case 'global':
      default:
        return 0;
    }
  }

  const createShoutMutation = useMutation(async () => {
    let payload = {
      action: 'send_shout',
      data: {
        shout: {
          scope: tab,
          scope_id: getScopeID(),
          author: user._id,
          message,
        }
      }
    };

    let data = await request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onSuccess: (data) => {
      showToast(toast, 'success', 'Shout Successful', data?.message);
      queryClient.invalidateQueries('getShouts');
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Shout Failed', e.message);
    }
  });

  const handleShout = () => {
    createShoutMutation.mutate();
    setMessage('');
  }

  return (
    <div className='mt-4 px-12'>
      <Tabs variant='enclosed' isLazy>
        <div className='bg-night rounded shadow-md text-white'>
          <TabList borderColor='accent-alt'>
            <Tab className='h-brand' _selected={{ color: 'accent' }} onClick={() => setTab('global')}>Global</Tab>
            <Tab className='h-brand' _selected={{ color: 'accent' }} onClick={() => setTab('country')}>Country</Tab>
            <Tab className='h-brand' _selected={{ color: 'accent' }} onClick={() => setTab('party')}>Party</Tab>
            <Tab className='h-brand' _selected={{ color: 'accent' }} onClick={() => setTab('unit')}>Unit</Tab>
          </TabList>
        </div>        
        <div className='mt-2 bg-night rounded shadow-md text-white'>
          <div className='p-4'>
            <p className='text-sm font-semibold'>Shout</p>
            <Textarea size='sm' resize='none' placeholder='Enter shout message' onChange={e => setMessage(e.target.value)} required />
            <Button variant='solid' colorScheme='blue' onClick={handleShout}>Shout</Button>
          </div>
          <hr />
          <TabPanels>
            <TabPanel>
              <ShoutTabContent scope='global' scope_id={getScopeID('global')} />
            </TabPanel>
            <TabPanel>
              <ShoutTabContent scope='country' scope_id={getScopeID('country')} />
            </TabPanel>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
          </TabPanels>
        </div>
      </Tabs>
    </div>
  )
}

const ShoutTabContent: React.FC<IShoutTab> = ({ scope, scope_id }) => {
  const cookies = parseCookies();

  const query = useQuery('getShouts', () => {
    return request({
      url: `/api/shouts?scope=${scope}&scope_id=${scope_id}`,
      method: 'GET',
      token: cookies.token,
    });
  });

  return (
    <>
      {query.isSuccess && query.data?.shouts.length === 0 && (
        <p>No Recent Shouts</p>
      )}
      {query.isSuccess && query.data?.shouts.length > 0 && (
        <div className='flex flex-col gap-4'>
          {query.data?.shouts.map((shout, i) => (
            <div key={i} className='flex flex-col gap-1'>
              <div className='flex justify-between'>
                <div className='flex gap-2 items-center cursor-pointer w-max'>
                  <Avatar
                    boxSize='2.0rem'
                    src={query.data.authors[shout.author].image}
                    name={query.data.authors[shout.author].username}
                  />
                  <span className='text-accent-alt font-semibold'>
                    {query.data.authors[shout.author].username}
                  </span>
                </div>
                <span>
                  {format(addMinutes(shout.timestamp, new Date(shout.timestamp).getTimezoneOffset()), 'MM/dd/yyyy HH:mm')}
                </span>
              </div>
              <div className='py-2 px-4 rounded' style={{ backdropFilter: 'brightness(90%)' }}>
                {shout.message}
              </div>
              <div className='flex justify-between'>
                <span>Likes: {shout.likes.length}</span>
                <span className='text-accent cursor-pointer'>Reply</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Shouts;