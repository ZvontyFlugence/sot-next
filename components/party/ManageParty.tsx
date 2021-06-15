import { IParty } from "@/models/Party";
import { IUser } from "@/models/User";
import { request } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Button } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { Badge } from "@chakra-ui/layout";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { Router, useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useState } from "react";
import { useQuery } from "react-query";
import Select from "../Select";
import { getRoleColor, IMemberInfo } from './PartyBody';

interface IManagePartyProps {
  user_id: number,
  party: IParty,
}

interface ITabs {
  [key: string]: React.ReactNode,
}



const ManageParty: React.FC<IManagePartyProps> = ({ user_id, party }) => {
  const cookies = parseCookies();
  const [tab, setTab] = useState<string>('Members');

  const { isLoading, data, error } = useQuery('getPartyMembers', async () => {
    let members: IMemberInfo[] = [];

    for (let memberId of party.members) {
      const { user: member }: { user: IUser } = await request({
        url: `/api/users/${memberId}`,
        method: 'GET',
        token: cookies.token,
      });

      let role: string = 'Member';

      if (party.president === member._id)
        role = 'Party President';
      else if (party.vp === member._id)
        role = 'Vice Party President';

      members.push({
        id: member._id,
        name: member.username,
        image: member.image,
        role,
      } as IMemberInfo);
    }

    return { members };
  });

  const TABS: ITabs = {
    'Members': <ManagePartyMembers user_id={user_id} members={data?.members} />,
  }

  return (
    <div className='w-full'>
      <div className="hidden md:block">
        <Tabs className='flex gap-4' orientation='vertical'>
          <TabList className='bg-night rounded shadow-md text-white'>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Members</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Party Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Congress Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Country Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Settings</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {!isLoading && !error && (
                <ManagePartyMembers user_id={user_id} members={data?.members} />
              )}
            </TabPanel>
            <TabPanel>

            </TabPanel>
            <TabPanel>

            </TabPanel>
            <TabPanel>

            </TabPanel>
            <TabPanel>

            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
      <div className="block md:hidden">
        <div className='flex flex-col gap-2'>
          <Select onChange={tab => setTab(tab as string)}>
              {Object.keys(TABS).map((key: string, i: number) => (
                <Select.Option key={i} value={key}>
                  {key}
                </Select.Option>
              ))}
          </Select>
          <div>
            {TABS[tab]}
          </div>
        </div>
      </div>
    </div>
  );
}

interface IManagePartyMembers {
  user_id: number,
  members: IMemberInfo[],
}

const ManagePartyMembers: React.FC<IManagePartyMembers> = ({ user_id, members }) => {
  const router = useRouter();
  const [selected, setSelected] = useState<number | undefined>();
  const {isOpen: isEditOpen, onOpen: onOpenEdit, onClose: onCloseEdit} = useDisclosure();
  const {isOpen: isRemoveOpen, onOpen: onOpenRemove, onClose: onCloseRemove} = useDisclosure();

  const handleOpen = (type: string, id: number) => {
    setSelected(id);
    
    switch (type.toLowerCase()) {
      case 'edit': {
        onOpenEdit();
        break;
      }
      case 'remove': {
        onOpenRemove();
        break;
      }
      default: {
        setSelected(undefined);
        break;
      }
    }
  }

  const handleClose = (type: string) => {
    setSelected(undefined);

    switch (type.toLowerCase()) {
      case 'edit': {
        onCloseEdit();
        break;
      }
      case 'remove': {
        onCloseRemove();
        break;
      }
      default:
        break;
    }
  }

  const handleEdit = () => {

  }

  const handleRemove = () => {

  }

  return (
    <div className='flex flex-col gap-4 bg-night shadow-md rounded px-2 md:px-4 py-2'>
      <h3 className='text-xl text-accent font-semibold mb-0 md:mb-4'>Members:</h3>
      {members.map((member: IMemberInfo, i: number) => (
        <div key={i} className='flex justify-between items-center'>
          <div className='flex items-center flex-grow cursor-pointer' onClick={() => router.push(`/profile/${member.id}`)}>
            <Avatar boxSize='3.0rem' src={member.image} name={member.name} borderRadius='full' />
            <div className='hidden md:block'>
              <span className='ml-2 text-white font-semibold'>{member.name}</span>
            </div>
            <div className='flex md:hidden flex-col ml-2'>
              <span className='text-white font-semibold'>{member.name}</span>
              <Badge className='block md:hidden' colorScheme={getRoleColor(member.role)}>{member.role}</Badge>
            </div>
          </div>
          <div className='hidden md:block flex-grow'>
            <Badge colorScheme={getRoleColor(member.role)}>{member?.role}</Badge>
          </div>
          {user_id !== member.id && (
            <div className='flex flex-col items-center gap-2'>
              <Button size='sm' colorScheme='orange' onClick={() => handleOpen('edit', member.id)}>Edit</Button>
              <Button size='sm' colorScheme='red' onClick={() => handleOpen('remove', member.id)}>Remove</Button>
            </div>
          )}
        </div>
      ))}

      <Modal isOpen={isEditOpen} onClose={() => handleClose('edit')}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className='h-brand text-accent font-semibold'>Edit Party Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>

          </ModalBody>
          <ModalFooter>
            <Button colorScheme='orange' onClick={handleEdit}>Edit</Button>
            <Button variant='outline' colorScheme='' onClick={() => handleClose('edit')}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRemoveOpen} onClose={() => handleClose('remove')}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className='h-brand text-accent font-semibold'>Remove User From Party</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to remove user: <span className='text-accent-alt'>{members.find(m => m.id === selected)?.name}</span>?
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='red' onClick={handleRemove}>Yes</Button>
            <Button variant='outline' colorScheme='' onClick={() => handleClose('remove')}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default ManageParty;