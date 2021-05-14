import Layout from '@/components/Layout';
import ComposeModal from '@/components/sidebar/ComposeModal';
import MailThread from '@/components/sidebar/MailThread';
import { IUser } from '@/models/User';
import { getCurrentUser } from '@/util/auth';
import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { useToast } from '@chakra-ui/toast';
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

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl font-semibold pl-4 text-accent'>My Mail</h1>
      <div className='flex justify-end gap-4 pr-12'>
        <Button variant='solid' colorScheme='green' onClick={onOpen}>Compose</Button>
      </div>
      {user.messages.length > 0 ? (
        <div className='mt-4 mx-12 bg-night shadow-md rounded'>
          {user.messages.map((thread, i) => (
            <MailThread key={i} thread={thread} index={i} userId={user._id} />
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

export const getServerSideProps = async ctx => {
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