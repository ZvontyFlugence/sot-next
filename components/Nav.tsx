import { useRouter } from 'next/router';
import { Avatar, Box, Button, HStack, IconButton, Image, Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList } from '@chakra-ui/react';
import { ChevronDownIcon, CalendarIcon, TimeIcon, HamburgerIcon } from '@chakra-ui/icons';
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
    router.push('/login');
  }

  const getPartyLink = () => {
    return user.party === 0 ? '/party' : `/party/${user.party}`;
  }

  const getUnitLink = () => {
    return user.unit === 0 ? '/unit' : `/unit/${user.unit}`;
  }

  const getNewsLink = () => {
    return user.newspaper === 0 ? '/newspaper' : `/newspaper/${user.newspaper}`;
  }

  return (
    <div className='flex w-full justify-between px-8 py-2 shadow-md border-solid border-black border border-opacity-25 bg-night text-white'>
      <div>
        <div className='flex items-center max-w-max cursor-pointer' onClick={goHome}>
          <Image boxSize='3rem' src='/logo_banner.png' name='State of Turmoil Logo' />
          <span className='text-2xl font-semibold ml-4 h-brand'>State of Turmoil</span>
        </div>
      </div>
      {!user && (
        <>
          <div className='hidden md:flex flex-grow-4 justify-end max-w-max'>
            <HStack spacing='24px'>
              <Box className='cursor-pointer' onClick={() => router.push('/login')}>Login</Box>
              <Box className='cursor-pointer' onClick={() => router.push('/register')}>Register</Box>
            </HStack>
          </div>          
          <div className='flex md:hidden flex-grow-4 jutify-end max-w-max'>
            <Menu>
              <MenuButton>
                <HamburgerIcon className='text-xl' />
              </MenuButton>
              <MenuList bgColor='night'>
                <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/login')}>Login</MenuItem>
                <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/register')}>Register</MenuItem>
              </MenuList>
            </Menu>
          </div>
        </>
      )}
      {user && (
        <>
          <div className='hidden md:flex flex-grow-4 justify-end max-w-max h-brand'>
            <HStack spacing='24px'>
              <Menu>
                <MenuButton className='hover:text-accent'>
                  <span className='mr-2'>My Places</span>
                  <ChevronDownIcon />
                </MenuButton>
                <MenuList bgColor='night'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/home')}>My Home</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/companies')}>My Companies</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(getPartyLink())}>My Party</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(getNewsLink())}>My Newspaper</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(getUnitLink())}>My Army</MenuItem>
                </MenuList>
              </Menu>
              <Menu>
                <MenuButton className='hover:text-accent'>
                  <span className='mr-2'>Markets</span>
                  <ChevronDownIcon />
                </MenuButton>
                <MenuList bgColor='night'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/markets/goods')}>Goods</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/markets/job')}>Jobs</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }}>Exchange</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }}>Companies</MenuItem>
                </MenuList>
              </Menu>
              <Box className='cursor-pointer hover:text-accent' onClick={() => router.push('/battles')}>Battles</Box>
              <Menu>
                <MenuButton className='hover:text-accent'>
                  <span className='mr-2'>Social</span>
                  <ChevronDownIcon />
                </MenuButton>
                <MenuList bgColor='night'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(`/country/${user.country}`)}>My Country</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/elections')}>Elections</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/rankings')}>Rankings</MenuItem>
                </MenuList>
              </Menu>
              <Box className='cursor-pointer hover:text-accent' onClick={() => router.push('/map')}>World Map</Box>
              <Box>
                <CalendarIcon />
                <span className='ml-2'>{formattedDate}</span>
              </Box>
              <Box>
                <TimeIcon />
                <span className='ml-2'>{formattedTime}</span>
              </Box>
              <Menu>
                <MenuButton as={Button} bgColor='night' _hover={{ color: 'accent' }} _active={{ color: 'accent' }} rightIcon={<ChevronDownIcon />}>Account</MenuButton>
                <MenuList bgColor='night'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(`/profile/${user._id}`)}>Profile</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/settings')}>Settings</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={logout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </div>
          <div className='flex md:hidden flex-grow-4 jutify-end max-w-max'>
            <Menu>
              <MenuButton>
                <HamburgerIcon className='text-xl' />
              </MenuButton>
              <MenuList bgColor='night'>
                <MenuGroup title='My Places'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/home')}>My Home</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/companies')}>My Companies</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(getPartyLink())}>My Party</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(getNewsLink())}>My Newspaper</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(getUnitLink())}>My Army</MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuGroup title='Markets'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/markets/goods')}>Goods</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/markets/job')}>Jobs</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }}>Exchange</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }}>Companies</MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/battles')}>Battles</MenuItem>
                <MenuDivider />
                <MenuGroup title='Social'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(`/country/${user.country}`)}>My Country</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/elections')}>Elections</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/rankings')}>Rankings</MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/map')}>World Map</MenuItem>
                <MenuDivider />
                <MenuGroup title='Account'>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push(`/profile/${user._id}`)}>Profile</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={() => router.push('/settings')}>Settings</MenuItem>
                  <MenuItem _hover={{ bg: 'accent-alt' }} _focus={{ bg: 'accent-alt' }} onClick={logout}>Logout</MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuItem>
                  <CalendarIcon />
                  <span className='ml-2'>{formattedDate}</span>
                </MenuItem>
                <MenuItem>
                  <TimeIcon />
                  <span className='ml-2'>{formattedTime}</span>
                </MenuItem>
              </MenuList>
            </Menu>
          </div>
        </>
      )}
    </div>
  );
}

export default Nav;