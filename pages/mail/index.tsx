import Layout from '@/components/Layout';
import ComposeModal from '@/components/sidebar/ComposeModal';
import MailItem from '@/components/sidebar/MailItem';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { getCurrentUser } from '@/util/auth';
import { refreshData, request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { useToast } from '@chakra-ui/toast';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';

interface IMail {
  user: IUser,
  isAuthenticated: boolean,
}

const Mail: React.FC<IMail> = ({ user, ...props }) => {
  const cookies = parseCookies();
  const toast = useToast();
  const router = useRouter();
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  const readAll = () => {
    (async () => {
      let values = await Promise.all(user && user.messages.filter(thrd => !thrd.read).map(async (thread, i) => {
        let payload = { action: UserActions.READ_THREAD, data: { thread_id: thread.id} };
        return await request({
          url: '/api/me/doAction',
          method: 'POST',
          payload,
          token: cookies.token,
        });
      }));
  
      try {
        if (!values.every(res => res.success)) {
          let index = values.findIndex(res => !res.success && res?.error);
          throw new Error(index >= 0 ? values[index].error : 'Unknown Error');
        }

        showToast(toast, 'success', 'All Threads Marked as Read');
        refreshData(router);
      } catch (e) {
        showToast(toast, 'error', 'Error', e.message);
      }
    })();
  }

  const deleteAll = () => {
    (async () => {
      let values = await Promise.all(user && user.messages.map(async (thread, i) => {
        let payload = { action: UserActions.DELETE_THREAD, data: { thread_id: thread.id} };
        return await request({
          url: '/api/me/doAction',
          method: 'POST',
          payload,
          token: cookies.token,
        });
      }));
  
      try {
        if (!values.every(res => res.success)) {
          let index = values.findIndex(res => !res.success && res?.error);
          throw new Error(index >= 0 ? values[index].error : 'Unknown Error');
        }

        showToast(toast, 'success', 'All Threads Deleted');
        refreshData(router);
      } catch (e) {
        showToast(toast, 'error', 'Error', e.message);
      }
    })();
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl font-semibold pl-4 text-accent'>My Mail</h1>
      <div className='flex justify-end gap-4 pr-12'>
        <Button variant='solid' colorScheme='green' onClick={onOpen}>Compose</Button>
        <Button variant='solid' colorScheme='blue' onClick={readAll}>Read All</Button>
        <Button variant='solid' colorScheme='red' onClick={deleteAll}>Delete All</Button>
      </div>
      {user.messages.length > 0 ? (
        <div className='mt-4 mx-12 bg-night shadow-md rounded'>
          {user.messages.map((thread, i) => (
            <MailItem key={i} thread={thread} index={i} userId={user._id} />
          ))}
        </div>
      ) : (
        <p className='mt-4 mx-12 bg-night text-white shadow-md rounded py-2 px-4'>
          You do not have any mail
        </p>
      )}
      <ComposeModal user={user} isOpen={isOpen} onClose={onClose} />
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  let { req } = ctx;

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

  return {
    props: { ...result },
  };
}

export default Mail;