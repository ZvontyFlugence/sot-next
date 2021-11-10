import Layout from "@/components/Layout";
import User, { IThread, IUser } from "@/models/User";
import { UserActions } from "@/util/actions";
import { getCurrentUser } from "@/util/auth";
import { refreshData, request, showToast } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Tag } from "@chakra-ui/tag";
import { Textarea } from "@chakra-ui/textarea";
import { useToast } from "@chakra-ui/toast";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from "nookies";
import { useEffect, useState } from "react";
import { useMutation } from "react-query";

interface IMailThread {
  user: IUser,
  isAuthenticated: boolean,
  thread: IThread,
  participants: IParticipant[],
}

interface IParticipant {
  id: number,
  image: string,
  username: string,
}

const MailThread: React.FC<IMailThread> = ({ user, thread, participants, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      if (!thread?.read) {
        readThreadMutation.mutate();
      }
    }
  }, [thread]);

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

  const handleReply = () => {
    let payload = {
      action: UserActions.SEND_MSG,
      data: {
        thread_id: thread.id,
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
        setMessage('');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Send Failed', data?.error);
      }
    });
  }

  return user ? (
    <Layout user={user}>
      {thread && (
        <>
          <h1 className='text-2xl font-semibold pl-4 text-accent'>
            Mail Thread: { thread.subject }
          </h1>
          <div className='grid grid-cols-3 gap-4 pr-4 mt-4 items-start'>
            <div className='bg-night text-white rounded shadow-md col-span-2 py-2 px-4'>
              <h3>Messages</h3>
              <div className='mt-4 px-4'>
                {thread.messages.map((msg, i) => {
                  let from = participants.find(p => p.id === msg.from);
                  return from ? (
                    from.id !== user._id ? (
                      <div className='flex justify-between gap-2'>
                        <Avatar
                          className='cursor-pointer'
                          boxSize='2.5rem'
                          src={from.image}
                          name={from.username}
                          onClick={() => router.push(`/profile/${from.id}`)}
                        />
                        <div className='flex flex-col flex-grow items-start gap-1'>
                          <span className='text-accent-alt cursor-pointer' onClick={() => router.push(`/profile/${from.id}`)}>
                            {from.username}
                          </span>
                          <p className='ml-2 py-1 px-2 rounded' style={{ backdropFilter: 'brightness(90%)' }}>
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='flex justify-between gap-2'>
                        <div className='flex flex-col flex-grow items-end gap-1'>
                          <span className='text-accent-alt cursor-pointer' onClick={() => router.push(`/profile/${from.id}`)}>
                            {from.username}
                          </span>
                          <p className='mr-2 py-1 px-2 rounded' style={{ backdropFilter: 'brightness(90%)' }}>
                            {msg.message}
                          </p>
                        </div>
                        <Avatar
                          className='cursor-pointer'
                          boxSize='2.5rem'
                          src={from.image}
                          name={from.username}
                          onClick={() => router.push(`/profile/${from.id}`)}
                        />
                      </div>
                    )
                  ) : (
                    <></>
                  );
                })}
              </div>
              <div className='flex flex-col justify-center items-end mt-4'>
                <FormControl>
                  <FormLabel>Reply</FormLabel>
                  <Textarea placeholder='Enter Message' value={message} onChange={e => setMessage(e.target.value)} />
                </FormControl>
                <Button className='w-max' variant='solid' colorScheme='blue' onClick={handleReply}>Reply</Button>
              </div>
            </div>
            <div className='bg-night text-white rounded shadow-md py-2 px-4'>
              <h3>Participants</h3>
              {participants.filter(p => p.id !== user._id).map((participant, i) => (
                <div key={i} className='flex flex-col gap-4 justify-center items-center'>
                  <Tag
                    className='py-1 w-max cursor-pointer'
                    size='lg'
                    variant='subtle'
                    colorScheme='blackAlpha'
                    _hover={{ color: 'whiteAlpha' }}
                    onClick={() => router.push(`/profile/${participant.id}`)}
                  >
                    <Avatar boxSize='2.5rem' className='mr-2' src={participant.image} name={participant.username} />
                    <span className='text-accent-alt'>{participant.username}</span>
                  </Tag>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  let { req, params } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let thread: IThread = result.user.messages.find(thrd => thrd.id === (params.id as string));
  let participants: IParticipant[] = [];

  for (let participant of thread.participants) {
    let user: IUser = await User.findOne({ _id: participant }).exec();
    participants.push({
      id: user._id,
      image: user.image,
      username: user.username,
    });
  }

  return {
    props: { ...result, thread, participants },
  };
}

export default MailThread;