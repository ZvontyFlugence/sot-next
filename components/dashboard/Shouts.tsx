import { IShout } from '@/models/Shout';
import { IUser } from '@/models/User';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar } from '@chakra-ui/avatar';
import { Button } from '@chakra-ui/button';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/tabs';
import { Textarea } from '@chakra-ui/textarea';
import { useToast } from '@chakra-ui/toast';
import { addMinutes, format } from 'date-fns';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';
import { BsHeart, BsHeartFill } from 'react-icons/bs';
import useSWR, { useSWRConfig } from 'swr';

interface IShouts {
  user: IUser,
}

interface IShoutTab {
  scope: 'global' | 'country' | 'party' | 'unit',
  scope_id: number,
  user: IUser,
  setParent: (shout: IShout) => void,
  setAuthor: (author: string) => void,
}

const Shouts: React.FC<IShouts> = ({ user }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const { mutate } = useSWRConfig();

  const [tab, setTab] = useState<'global' | 'country' | 'party' | 'unit'>('global');
  const [parent, setParent] = useState<IShout>(null);
  const [parentAuthor, setParentAuthor] = useState('');
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

  const handleShout = () => {
    let payload = {
      action: 'send_shout',
      data: {
        shout: {
          parent: parent?._id || undefined,
          scope: tab,
          scope_id: getScopeID(),
          author: user._id,
          message,
        }
      }
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', 'Shout Successful', data?.message);
        setMessage('');
        mutate(`/api/shouts?scope=${tab}&scope_id=${getScopeID()}`);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Shout Failed', data?.error);
      }
    });
  }

  const handleSetParent = (parent: IShout) => {
    setParent(parent);
  }

  const handleSetParentAuthor = (author: string) => {
    setParentAuthor(author);
  }

  return (
    <div className='mt-4 px-8 md:px-12'>
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
            <p className='text-sm font-semibold'>
              {parent && parentAuthor ? (
                <span>Reply To <span className='text-accent-alt' onClick={() => router.push(`/profile/${parent.author}`)}>{parentAuthor}</span></span>
              ) : (
                <span>Shout</span>
              )}
            </p>
            <Textarea size='sm' resize='none' placeholder='Enter shout message' value={message} onChange={e => setMessage(e.target.value)} required />
            <Button size='sm' variant='solid' colorScheme='blue' onClick={handleShout}>Shout</Button>
          </div>
          <hr />
          <TabPanels>
            <TabPanel>
              <ShoutTabContent scope='global' scope_id={getScopeID('global')} user={user} setParent={handleSetParent} setAuthor={handleSetParentAuthor} />
            </TabPanel>
            <TabPanel>
              <ShoutTabContent scope='country' scope_id={getScopeID('country')} user={user} setParent={handleSetParent} setAuthor={handleSetParentAuthor} />
            </TabPanel>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
          </TabPanels>
        </div>
      </Tabs>
    </div>
  )
}

export const getShoutsFetcher = (url: string, token: string) => request({ url, method: 'GET', token });

const ShoutTabContent: React.FC<IShoutTab> = ({ scope, scope_id, user, setParent, setAuthor }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [selected, setSelected] = useState(0);
  const [replies, setReplies] = useState<IShout[]>([]);
  const [replyAuthors, setReplyAuthors] = useState([]);

  useEffect(() => {
    request({
      url: `/api/shouts?scope=${scope}&scope_id=${scope_id}&parent_id=${selected}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      setReplies(data?.shouts || []);
      setReplyAuthors(data?.authors || []);
    });
  }, [selected]);


  const query = useSWR([`/api/shouts?scope=${scope}&scope_id=${scope_id}`, cookies.token], getShoutsFetcher);

  const handleLike = (shout: IShout) => {
    let shout_id: number = shout._id;
    if (shout.likes.includes(user._id)) {
      unlike(shout_id);
    } else {
      like(shout_id);
    }
  }

  const like = (shout_id: number) => {
    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload: { action: 'like_shout', data: { shout_id } },
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message || 'Shout Liked');
        query.mutate();
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Failed to Like Shout', data?.error);
      }
    });
  }

  const unlike = (shout_id: number) => {
    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload: { action: 'unlike_shout', data: { shout_id } },
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message || 'Shout Unliked');
        query.mutate();
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Failed to Unlike Shout', data?.error);
      }
    });
  }

  const handleSelect = (shout: IShout) => {
    if (selected === shout._id) {
      setSelected(0);
      setParent(null);
      setAuthor('');
    } else {
      setSelected(shout._id);
      setParent(shout);
      setAuthor(query.data.authors[shout.author].username);
    }
  }

  const getDate = (timestamp: Date) => {
    let now = new Date(Date.now());
    let sameDay = format(addMinutes(timestamp, timestamp.getTimezoneOffset()), 'HH:mm');
    let pastDay = format(addMinutes(timestamp, timestamp.getTimezoneOffset()), 'M/d/yy');

    if (now.getUTCDate() !== timestamp.getUTCDate() && now.getUTCMonth() !== timestamp.getUTCDate()
      && now.getUTCFullYear() !== timestamp.getUTCFullYear()) {
        return sameDay;
    }

    return pastDay;
  }

  return (
    <>
      {query.data && query.data?.shouts.length === 0 && (
        <p>No Recent Shouts</p>
      )}
      {query.data && query.data?.shouts.length > 0 && (
        <div className='flex flex-col gap-4'>
          {query.data?.shouts.map((shout, i) => (
            <div key={i} className='flex flex-col gap-1'>
              <div className='flex justify-between items-center'>
                <div className='flex gap-2 items-center cursor-pointer w-max' onClick={() => router.push(`/profile/${shout.author}`)}>
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
                  {getDate(new Date(shout.timestamp))}
                </span>
              </div>
              <div className='py-2 px-4 rounded' style={{ backdropFilter: 'brightness(90%)' }}>
                {shout.message}
              </div>
              <div className='flex justify-between'>
                <Button
                  variant='ghost'
                  color={shout.likes.includes(user._id) ? 'accent' : 'white'}
                  _hover={{ bg: 'transparent', color: shout.likes.includes(user._id) ? 'white' : 'accent' }}
                  leftIcon={shout.likes.includes(user._id) ? <BsHeartFill /> : <BsHeart />}
                  onClick={() => handleLike(shout)}
                >
                  {shout.likes.length} Likes
                </Button>
                <span className='text-accent-alt cursor-pointer' onClick={() => handleSelect(shout)}>Reply</span>
              </div>
              {selected === shout._id && replies.length === 0 && (
                <p className='mx-auto'>This Shout Has No Replies</p>
              )}
              {selected === shout._id && replies.length > 0 && (
                <div className='flex flex-col w-5/6 mx-auto'>
                  {replies.map((reply, i) => (
                    <div key={i} className='flex flex-col gap-1'>
                      <div className='flex justify-between items-center'>
                        <div className='flex gap-2 items-center cursor pointer w-max' onClick={() => router.push(`/profile/${reply.author}`)}>
                          <Avatar
                            boxSize='1.8rem'
                            src={replyAuthors[reply.author]?.image}
                            name={replyAuthors[reply.author]?.username}
                          />
                          <span className='text-accent-alt font-semibold'>
                            {replyAuthors[reply.author]?.username}
                          </span>
                        </div>
                        <span>
                          {getDate(new Date(reply.timestamp))}
                        </span>
                      </div>
                      <div className='py-2 px-4 rounded' style={{ backdropFilter: 'brightness(90%)' }}>
                        {reply.message}
                      </div>
                      <div className='flex justify-end'>
                        <Button
                          variant='ghost'
                          color={reply.likes.includes(user._id) ? 'accennt' : 'white'}
                          _hover={{ bg: 'transparent', color: reply.likes.includes(user._id) ? 'white' : 'accent' }}
                          leftIcon={reply.likes.includes(user._id) ? <BsHeartFill /> : <BsHeart />}
                          onClick={() => handleLike(reply)}
                        >
                          {reply.likes.length} Likes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Shouts;