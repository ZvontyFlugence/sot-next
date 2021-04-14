import { IUser } from "@/models/User";
import { Button } from "@chakra-ui/button";
import { BellIcon, EmailIcon } from '@chakra-ui/icons';
import { useRouter } from "next/router";
import Card from "./Card";
import { Progress } from "@chakra-ui/progress";
import { neededXP, refreshData } from "@/util/ui";
import { GiHeartPlus } from 'react-icons/gi';
import { List, ListItem } from "@chakra-ui/layout";
import { Avatar } from "@chakra-ui/avatar";
import { Tag } from "@chakra-ui/tag";
import { useQuery, useMutation } from 'react-query';
import { parseCookies } from 'nookies';
import { useToast } from "@chakra-ui/toast";

interface ISidebar {
  user: IUser,
}

const Sidebar: React.FC<ISidebar> = ({ user }) => {
  const router = useRouter();
  const toast = useToast();
  const cookies = parseCookies();

  const hasHealed = new Date(user.canHeal) > new Date(Date.now());

  const walletQuery = useQuery('getWalletInfo', () => {
    return fetch('/api/me/wallet-info', { headers: { authorization: `Bearer ${cookies.token}` } })
      .then(res => res.json());
  });

  const locationQuery = useQuery('getLocationInfo', () => {
    return fetch('/api/me/location-info', { headers: { authorization: `Bearer ${cookies.token}` } })
      .then(res => res.json());
  });

  const healMutation = useMutation(() => {
    let payload = { action: 'heal' };
    return fetch('/api/me/doAction', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${cookies.token}`,
      },
      body: JSON.stringify(payload),
    }).then(res => res.json());
  }, {
    onSuccess: (data) => {
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
    },
    onError: (e) => {
      toast({
        position: 'top-right',
        title: 'Error Occurred',
        description: e,
        status: 'error',
        duration: 2500,
        isClosable: true,
      });
    },
  });

  const handleHeal = () => {
    if (user.health < 100 && !hasHealed) {
      healMutation.mutate();
    }
  }

  return (
    <Card>
      <Card.Header
        className='flex flex-col justify-center items-center cursor-pointer'
        onClick={() => router.push(`/profile/${user._id}`)}
      >
        <Avatar size='2xl' name={user.username} src={user.image} />
        <span>{ user.username } <Tag variant='solid' colorScheme='blue'>{user.level}</Tag></span>
      </Card.Header>
      <Card.Content>
        <hr className='mt-2 mb-2' />
        <div className='flex justify-center gap-5'>
          <Button
            variant='outline'
            aria-label='View Mail'
            colorScheme={user.messages.length > 0 ? 'red' : 'gray'}
            leftIcon={<EmailIcon />}
            size='sm'
          >{user.messages.length}</Button>
          <Button
            variant='outline'
            aria-label='View Alerts'
            colorScheme={user.alerts.length > 0 ? 'red' : 'gray'}
            size='sm'
            leftIcon={<BellIcon />}
          >{user.alerts.length}</Button>
        </div>
        <div className='mt-2'>
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
        {(!locationQuery.isLoading && !locationQuery.isError) && (
          <div className='flex justify-between mt-2'>
            <p>
              <span className='cursor-pointer' onClick={() => router.push(`/region/${user.location}`)}>
                {locationQuery.data.locationInfo.region_name}
              </span>,&nbsp;
              <span className='cursor-pointer' onClick={() => router.push(`/country/${locationQuery.data.locationInfo.owner_id}`)}>
                {locationQuery.data.locationInfo.owner_name}
              </span>
            </p>
            <span
              className={`cursor-pointer flag-icon flag-icon-${locationQuery.data.locationInfo.owner_flag}`}
              onClick={() => router.push(`/country/${locationQuery.data.locationInfo.owner_id}`)}
            ></span>
          </div>
        )}
        <div className='mt-2'>
          <List>
            <ListItem className='flex justify-between'>
              <span>Gold</span>
              <p className='flex items-center'>
                <span className='mr-2'>{user.gold.toFixed(2)}</span>
                <i className='sot-icon sot-coin' />
              </p>
            </ListItem>
            {(!walletQuery.isLoading && !walletQuery.isError) && (
              <ListItem className='flex justify-between'>
                <span>{walletQuery.data.walletInfo[user.country].currency}</span>
                <span>
                  {walletQuery.data.walletInfo[user.country].amount.toFixed(2)}
                  <span
                    className={`ml-2 cursor-pointer flag-icon flag-icon-${walletQuery.data.walletInfo[user.country].flag_code}`}
                    onClick={() => router.push(`/country/${user.country}`)}
                  ></span>
                </span>
              </ListItem>
            )}
          </List>
        </div>
      </Card.Content>
    </Card>
  );
}

export default Sidebar;