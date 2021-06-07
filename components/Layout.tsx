import { IUser } from "@/models/User";
import { Avatar } from "@chakra-ui/avatar";
import { Button, IconButton } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { Grid, GridItem } from "@chakra-ui/layout";
import { Drawer, DrawerContent, DrawerOverlay } from "@chakra-ui/modal";
import Nav from "./Nav";
import Sidebar from "./Sidebar";

interface ILayout {
  user: IUser
}

const Layout: React.FC<ILayout> = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <div className='hidden md:block h-screen w-full overflow-hidden'>
        <Nav user={user} />
        <div className='flex h-full overflow-y-auto'>
          <div className='w-1/5 mx-8 my-8'>
            <Sidebar user={user} />
          </div>
          <div className='w-4/5 mt-8'>
            {children}
          </div>
        </div>
      </div>
      <div className='block md:hidden relative'>
        <Nav user={user} />
        <IconButton
          className='fixed left-0 top-2'
          aria-label='Toggle Drawer'
          bgColor='night'
          color='accent-alt'
          icon={<ChevronLeftIcon className='text-2xl' />}
          onClick={onOpen}
        />
        <div className='mt-2'>
          {children}
        </div>
      </div>
      <Drawer isOpen={isOpen} placement='left' onClose={onClose} closeOnOverlayClick>
        <DrawerOverlay />
        <DrawerContent className='pointer-events-none' bgColor='transparent'>
          <div className='relative'>
            <div className='absolute top-1/2 transform translate-y-1/2 w-full'>
              <Sidebar user={user} />
            </div>          
          </div>          
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default Layout;