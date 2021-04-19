import { useRouter } from 'next/router';
import { Avatar, Box, Button, HStack, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { ChevronDownIcon, CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import { destroyCookie } from 'nookies';
import { IUser } from '@/models/User';
import { addMinutes, format } from 'date-fns';
import { refreshData } from '@/util/ui';

interface INav {
  user?: IUser,
}

const Nav: React.FC<INav> = ({ user }) => {
  const router = useRouter();
  let currentDate = new Date(Date.now());
  let formattedDate = format(addMinutes(currentDate, currentDate.getTimezoneOffset()), 'MMM dd, yyyy');
  let formattedTime = format(addMinutes(currentDate, currentDate.getTimezoneOffset()), 'HH:mm');

  const goHome = () => {
    if (user)
      router.push('/dashboard');
    else
      router.push('/');
  }

  const logout = () => {
    destroyCookie(null, 'token');
    refreshData(router);
    router.push('/');
  }

  return (
    <div className='flex w-full justify-between px-8 py-2 shadow-md border-solid border-black border border-opacity-25 bg-white'>
      <div>
        <div className='flex items-center max-w-max cursor-pointer' onClick={goHome}>
          <Avatar size='md' src={process.env.NEXT_PUBLIC_LOGO} name='State of Turmoil Logo' />
          <span className='text-2xl font-semibold ml-4'>State of Turmoil</span>
        </div>
      </div>
      {!user && (
        <HStack className='flex flex-grow-4 justify-end max-w-max' spacing='24px'>
          <Box className='cursor-pointer' onClick={() => router.push('/login')}>Login</Box>
          <Box className='cursor-pointer' onClick={() => router.push('/register')}>Register</Box>
        </HStack>
      )}
      {user && (
        <HStack className='flex flex-grow-4 justify-end max-w-max' spacing='24px'>
          <Menu>
            <MenuButton>
              <span className='mr-2'>My Places</span>
              <ChevronDownIcon />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => router.push('/home')}>My Home</MenuItem>
              <MenuItem onClick={() => router.push('/companies')}>My Companies</MenuItem>
              <MenuItem>My Party</MenuItem>
              <MenuItem>My Newspaper</MenuItem>
              <MenuItem>My Army</MenuItem>
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton>
              <span className='mr-2'>Markets</span>
              <ChevronDownIcon />
            </MenuButton>
            <MenuList>
              <MenuItem>Goods</MenuItem>
              <MenuItem onClick={() => router.push('/markets/job')}>Jobs</MenuItem>
              <MenuItem>Exchange</MenuItem>
              <MenuItem>Companies</MenuItem>
            </MenuList>
          </Menu>
          <Box className='cursor-pointer'>Battles</Box>
          <Menu>
            <MenuButton>
              <span className='mr-2'>Social</span>
              <ChevronDownIcon />
            </MenuButton>
            <MenuList>
              <MenuItem>My Country</MenuItem>
              <MenuItem>Elections</MenuItem>
              <MenuItem>Rankings</MenuItem>
            </MenuList>
          </Menu>
          <Box className='cursor-pointer'>World Map</Box>
          <Box>
            <CalendarIcon />
            <span className='ml-2'>{formattedDate}</span>
          </Box>
          <Box>
            <TimeIcon />
            <span className='ml-2'>{formattedTime}</span>
          </Box>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>Account</MenuButton>
            <MenuList>
              <MenuItem onClick={() => router.push(`/profile/${user._id}`)}>Profile</MenuItem>
              <MenuItem onClick={() => router.push('/settings')}>Settings</MenuItem>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      )}
    </div>
  );
}

export default Nav;