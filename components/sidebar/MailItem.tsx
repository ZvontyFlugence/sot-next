import { IThread, IUser } from "@/models/User";
import { UserActions } from "@/util/actions";
import { refreshData, request, showToast } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Tag, TagLabel } from "@chakra-ui/tag";
import { useToast } from "@chakra-ui/toast";
import { formatDistance } from "date-fns";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useEffect, useState } from "react";
import { Item, Menu, useContextMenu } from "react-contexify";
import { useMutation } from "react-query";

interface IMailItem {
  thread: IThread,
  index: number,
  userId: number,
}

const MailItem: React.FC<IMailItem> = ({ thread, index, userId }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [participants, setParticipants] = useState<IUser[]>([]);
  const { show } = useContextMenu({ id: `mail-${index}` });

  useEffect(() => {
    if (thread && participants.length === 0) {
      thread.participants.forEach(async u => {
        let data = await request({
          url: `/api/users/${u}`,
          method: 'GET',
          token: cookies.token,
        });

        if (data?.profile) {
          setParticipants(prev => [...prev, data?.profile]);
        }
      });
    }
  }, [thread, thread.participants, participants.length]);

  const readThreadMutation = useMutation(async () => {
    let payload = { action: UserActions.READ_THREAD, data: { thread_id: thread.id } };
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
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Error', e.message);
    }
  });

  const deleteThreadMutation = useMutation(async () => {
    let payload = { action: UserActions.DELETE_THREAD, data: { thread_id: thread.id } };
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
      showToast(toast, 'success', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', e.message);
    }
  })

  const getTimestamp = (): React.ReactNode => (
    <span>
      {formatDistance(new Date(thread.timestamp), new Date(Date.now()), { addSuffix: true })}
    </span>
  );

  const goToThread = () => {
    router.push(`/mail/thread/${thread.id}`);
  }

  const handleRead = () => {
    readThreadMutation.mutate();
  }

  const handleDelete = () => {
    deleteThreadMutation.mutate();
  }

  return (
    <>
      <div className={`flex py-2 px-4 alert-item border-b border-solid border-black border-opacity-25 ${thread.read ? 'bg-gray-500 bg-opacity-25' : ''}`} onContextMenu={show}>
        <div className={`flex justify-between items-center gap-4 py-1 cursor-pointer w-full text-white ${thread.read ? '' : 'font-semibold'}`} onClick={goToThread}>
          <div className='px-2'>
            <Tag
              className='flex-grow-0'
              size='sm'
              variant={thread.read ? 'outline' : 'solid'}
              borderRadius='full'
              bgColor={thread.read ? undefined : 'accent-alt'}
            />
          </div>
          <div className='flex flex-col flex-grow gap-0.5'>
            <span className='font-semibold'>{thread.subject}</span>
            {participants.filter(u => u._id !== userId).map((user: IUser) => (
              <Tag key={user._id} size='lg' colorScheme='whiteAlpha' borderRadius='full'>
                <Avatar
                  src={user.image}
                  size='xs'
                  name={user.username}
                  ml={-1}
                  mr={2}
                />
                <TagLabel>{user.username}</TagLabel>
              </Tag>
            ))}
            <div className='overflow-hidden overflow-ellipsis whitespace-nowrap' style={{ fontWeight: thread.read ? 'lighter' : 'bold' }}>
              { thread.messages[thread.messages.length - 1].message}
            </div>
          </div>
          <div className='px-4'>{getTimestamp()}</div>
        </div>
      </div>

      <Menu id={`mail-${index}`} theme='brand'>
        <Item onClick={handleRead} disabled={thread.read}>
          Mark as Read
        </Item>
        <Item onClick={handleDelete}>
          Delete
        </Item>
      </Menu>
    </>
  );
}

export default MailItem;