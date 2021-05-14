import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar } from '@chakra-ui/avatar';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import { Spinner } from '@chakra-ui/spinner';
import { Tag, TagCloseButton, TagLabel } from '@chakra-ui/tag';
import { Textarea } from '@chakra-ui/textarea';
import { useToast } from '@chakra-ui/toast';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { SyntheticEvent, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

interface IComposeMsg {
  user: IUser,
  profile?: IUser,
  isOpen: boolean,
  onClose: () => void,
}

const ComposeModal: React.FC<IComposeMsg> = ({ user, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [participant, setParticipant] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (props.profile)
      setUsers(curr => [...curr, props.profile]);
  }, [props.profile]);

  const query = useQuery('searchUser', () => {

  });

  const removeUser = (userID: number) => {
    let idx = users.findIndex(u => u._id === userID);
    if (idx > -1) {
      setUsers(prev => {
        prev.splice(idx, 1);
        return [...prev];
      });
    }
  }

  const handleSearch = (e: SyntheticEvent) => {
    let username = (e.target as HTMLInputElement).value
    setParticipant(username);
    setLoading(true);
    request({
      url: '/api/users',
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.users) {
        setResults(data.users.filter((u: IUser) => {
          return u.username.includes(username) && u._id !== user._id &&
            !users.find(usr => usr.username.includes(username));
        }));
        setLoading(false);
      }
    });
  }

  const handleSelection = (user: IUser) => {
    setUsers(prev => [...prev, user]);
    setResults([]);
    setParticipant('');
  }

  const handleCreateThread = () => {
    let payload = {
      action: UserActions.CREATE_THREAD,
      data: {        
        participants: users.map(u => u._id),
        subject,
        message,
        timestamp: new Date(Date.now()),        
      },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        handleClose();
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Send Failed', data?.error);
      }
    });
  }

  const resultItem = (result: IUser) => (
    <div key={result._id} className='flex items-center gap-2 py-2 px-4 cursor-pointer hover:bg-accent-alt' onClick={() => handleSelection(result)}>
      <div className='flex'>
        <Avatar size='sm' src={result.image} name={result.username} />
      </div>
      <div>{result.username}</div>
    </div>
  );

  const handleClose = () => {
    setParticipant('');
    setUsers([]);
    setLoading(false);
    setResults([]);
    setSubject('');
    setMessage('');
    props.onClose();
  }

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bgColor='night' color='white'>
        <ModalHeader className='h-brand text-accent'>Compose New Message</ModalHeader>
        <ModalCloseButton />
        <ModalBody className='flex flex-col gap-2'>
          <div className='relative w-max'>
            <Input className='border border-white border-opacity-25 shadow-md rounded' type='text' value={participant} onChange={handleSearch} />
            {participant.length > 0 && (
              <div className={`absolute top-12 left-0 bg-night rounded shadow-md w-full`}>
                {loading ? (
                  <Spinner size='lg' color='accent' />
                ) : results.map((result) => resultItem(result))}
              </div>
            )}
          </div>

          <div className='my-2'>
            <span>To: </span>
            {users.map((u, i) => (
              <Tag key={i} size='lg' colorScheme='whiteAlpha' borderRadius='full'>
                <Avatar
                  src={u.image}
                  size='xs'
                  name={u.username}
                  ml={-1}
                  mr={2}
                />
                <TagLabel>{u.username}</TagLabel>
                <TagCloseButton onClick={() => removeUser(u._id)} />
              </Tag>
            ))}
          </div>
          <FormControl>
            <FormLabel>Subject</FormLabel>
            <Input type='text' value={subject} onChange={e => setSubject(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Message</FormLabel>
            <Textarea placeholder='Enter Message' value={message} onChange={e => setMessage(e.target.value)} />
          </FormControl>
        </ModalBody>
        <ModalFooter className='flex gap-4'>
          <Button variant='solid' colorScheme='green' onClick={handleCreateThread}>Send</Button>
          <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ComposeModal;