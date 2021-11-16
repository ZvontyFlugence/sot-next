import { IUser } from "@/models/User";
import { Button } from "@chakra-ui/button";
import { BellIcon, EmailIcon } from '@chakra-ui/icons';
import { useRouter } from "next/router";
import Card from "./Card";
import { Progress } from "@chakra-ui/progress";
import { neededXP, refreshData, request } from "@/util/ui";
import { GiHeartPlus } from 'react-icons/gi';
import { List, ListItem } from "@chakra-ui/layout";
import { Avatar } from "@chakra-ui/avatar";
import { Tag } from "@chakra-ui/tag";
import { parseCookies } from 'nookies';
import { useToast } from "@chakra-ui/toast";
import useSWR from 'swr';

interface ISidebar {
  user: IUser,
}

export const getWalletInfoFetcher = (url: string, token: string) => {
  return fetch(url, { headers: { authorization: `Bearer ${token}` } })
    .then(res => res.json());
}

export const getLocationInfoFetcher = (url: string, token: string) => {
  return fetch(url, { headers: { authorization: `Bearer ${token}` } })
    .then(res => res.json());
}

const Sidebar: React.FC<ISidebar> = ({ user }) => {
  const router = useRouter();
  const toast = useToast();
  const cookies = parseCookies();

  const hasHealed = new Date(user.canHeal) > new Date(Date.now());

  const walletQuery = useSWR(['/api/me/wallet-info', cookies.token], getWalletInfoFetcher, { refreshInterval: 500 });
  const locationQuery = useSWR(['/api/me/location-info', cookies.token], getLocationInfoFetcher, { refreshInterval: 500 });

  const handleHeal = () => {
    if (user.health < 100 && !hasHealed) {
      // TODO: Update local swr cache (health, xp, str)
      request({
        url: '/api/me/doAction',
        method: 'POST',
        payload: { action: 'heal' },
        token: cookies.token,
      }).then(data => {
        if (data.success) {
          refreshData(router);
        } else {
          toast({
            position: 'top-right',
            title: 'Error Occurred',
            description: data.error,
            status: 'error',
            duration: 2500,
            isClosable: true,
          });
        }

        // Revalidate local swr cache
      });
    }
  }

  return (
    <div className='pointer-events-auto'>
      <Card>
        <Card.Header
          className='flex flex-col justify-center items-center cursor-pointer text-white'
          onClick={() => router.push(`/profile/${user._id}`)}
        >
          <Avatar size='2xl' name={user.username} src={user.image} />
          <span>{ user.username } <Tag variant='solid' colorScheme='blue'>{user.level}</Tag></span>
        </Card.Header>
        <Card.Content className='text-white mt-4'>
          <div className='flex justify-center gap-5'>
            <Button
              className={user.messages.filter(thr => !thr.read).length > 0 ? 'text-accent' : 'text-accent-alt'}
              variant='outline'
              aria-label='View Mail'
              colorScheme=''
              size='sm'
              leftIcon={<EmailIcon />}
              onClick={() => router.push('/mail')}
            >{user.messages.filter(thread => !thread.read).length}</Button>
            <Button
              className={user.alerts.filter(a => !a.read).length > 0 ? 'text-accent' : 'text-accent-alt'}
              variant='outline'
              aria-label='View Alerts'
              colorScheme=''
              size='sm'
              leftIcon={<BellIcon />}
              onClick={() => router.push('/alerts')}
            >{user.alerts.filter(a => !a.read).length}</Button>
          </div>
          <div className='mt-4'>
            <div className='mb-2'>
              <span className='text-sm'>XP: {user.xp} / {neededXP(user.level)} </span> 
              <Progress value={user.xp} min={0} max={neededXP(user.level)} size='sm' colorScheme='orange' hasStripe isAnimated />
            </div>
            <div className='mb-2'>
              <span className='text-sm'>Health: {user.health}%</span>
              <Progress value={user.health} size='sm' colorScheme='green' />
            </div>
          </div>
          <div className='flex justify-center mt-2'>
            <Button
              variant='solid'
              colorScheme='green'
              size='sm'
              width='50%'
              leftIcon={<GiHeartPlus />}
              disabled={(user.health >= 100) || hasHealed}
              onClick={handleHeal}
            >
              Heal
            </Button>
          </div>
          {(locationQuery.data && !locationQuery.error) && (
            <div className='flex justify-between mt-4'>
              <p>
                <span className='link' onClick={() => router.push(`/region/${user.location}`)}>
                  {locationQuery.data.locationInfo.region_name}
                </span>,&nbsp;
                <span className='link' onClick={() => router.push(`/country/${locationQuery.data.locationInfo.owner_id}`)}>
                  {locationQuery.data.locationInfo.owner_name}
                </span>
              </p>
              <span
                className={`cursor-pointer flag-icon flag-icon-${locationQuery.data.locationInfo.owner_flag} rounded shadow-md`}
                onClick={() => router.push(`/country/${locationQuery.data.locationInfo.owner_id}`)}
              ></span>
            </div>
          )}
          <div className='mt-4'>
            <List>
              <ListItem className='flex justify-between'>
                <span>Gold</span>
                <p className='flex items-center'>
                  <span className='mr-2'>{user.gold.toFixed(2)}</span>
                  <i className='sot-icon sot-coin' />
                </p>
              </ListItem>
              {(walletQuery.data && !walletQuery.error) && (
                <ListItem className='flex justify-between'>
                  <span>{walletQuery.data.walletInfo[user.country].currency}</span>
                  <span>
                    {walletQuery.data.walletInfo[user.country].amount.toFixed(2)}
                    <span
                      className={`ml-2 cursor-pointer flag-icon flag-icon-${walletQuery.data.walletInfo[user.country].flag_code} rounded shadow-md`}
                      onClick={() => router.push(`/country/${user.country}`)}
                    ></span>
                  </span>
                </ListItem>
              )}
            </List>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default Sidebar;