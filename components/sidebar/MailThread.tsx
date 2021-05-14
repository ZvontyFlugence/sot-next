import { IThread, IUser } from "@/models/User";
import { request } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Tag, TagLabel } from "@chakra-ui/tag";
import { formatDistance } from "date-fns";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useEffect, useState } from "react";
import { Item, Menu, useContextMenu } from "react-contexify";

interface IMailThread {
  thread: IThread,
  index: number,
  userId: number,
}

const MailThread: React.FC<IMailThread> = ({ thread, index, userId }) => {
  const cookies = parseCookies();
  const router = useRouter();
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

  const getTimestamp = (): React.ReactNode => (
    <span>
      {formatDistance(new Date(thread.timestamp), new Date(Date.now()), { addSuffix: true })}
    </span>
  );

  const goToThread = () => {
    router.push(`/mail/thread/${thread.id}`);
  }

  const handleRead = () => {

  }

  const handleDelete = () => {

  }

  return (
    <>
      <div className={`flex py-2 px-4 alert-item border-b border-solid border-black border-opacity-25 ${thread.read ? 'bg-gray-500 bg-opacity-25' : ''}`} onContextMenu={show}>
        <div className={`flex justify-between items-center gap-4 py-1 cursor-pointer w-full ${thread.read ? 'text-white' : 'text-accent-alt'}`}>
          <div className='flex flex-col gap-0.5'>
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

export default MailThread;