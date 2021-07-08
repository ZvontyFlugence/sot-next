import Select from '@/components/Select';
import { Avatar } from '@chakra-ui/avatar';
import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { Badge } from '@chakra-ui/layout';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useState } from 'react';
import { getRoleColor, IMemberInfo } from '../PartyMembers';
import { refreshData, request, showToast } from '@/util/ui';
import { PartyActions } from '@/util/actions';
import { parseCookies } from 'nookies';
import { useToast } from '@chakra-ui/react';

interface IManagePartyMembers {
  user_id: number,
  party_id: number,
  members: IMemberInfo[],
}

const ManagePartyMembers: React.FC<IManagePartyMembers> = ({ user_id, party_id, members }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [selected, setSelected] = useState<IMemberInfo | undefined>();
  const [memberRole, setMemberRole] = useState<string>('');

  const {isOpen: isEditOpen, onOpen: onOpenEdit, onClose: onCloseEdit} = useDisclosure();
  const {isOpen: isRemoveOpen, onOpen: onOpenRemove, onClose: onCloseRemove} = useDisclosure();

  useEffect(() => {
    if (selected) {
      switch (selected.role.toLowerCase()) {
        case 'Party President':
          setMemberRole('president');
          break;
        case 'Vice Party President':
          setMemberRole('vp');
          break;
        case 'Member':
        default:
          setMemberRole('member');
          break;
      }
    }
  }, [selected]);

  const handleOpen = (type: string, id: number) => {
    setSelected(members.find(mem => mem.id === id));
    
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
    let payload = {
      action: PartyActions.EDIT_MEMBER,
      data: {
        memberId: selected.id,
        role: memberRole,
      },
    };

    request({
      url: `/api/parties/${party_id}/doAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Failed to Edit Member', data?.error);
      }
    });
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
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent font-semibold'>Edit Party Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Role: </FormLabel>
              <Select className='rounded shadow-md border border-white border-opacity-25' selected={memberRole} onChange={val => setMemberRole(val as string)}>
                <Select.Option value='president'>
                  Party President
                </Select.Option>
                <Select.Option value='vp'>
                  Vice Party President
                </Select.Option>
                <Select.Option value='member'>
                  Member
                </Select.Option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter className='flex items-center gap-4'>
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
            Are you sure you want to remove user: <span className='text-accent-alt'>{selected?.name}</span>?
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

export default ManagePartyMembers;