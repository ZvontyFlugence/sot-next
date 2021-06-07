import { IUser } from '@/models/User';
import { destroyCookie } from 'nookies';
import { getCurrentUser } from '@/util/auth';
import { Box, SimpleGrid } from '@chakra-ui/layout';
import Dailies from '@/components/dashboard/Dailies';
import Shouts from '@/components/dashboard/Shouts';
import News from '@/components/dashboard/News';
import Layout from '@/components/Layout';

interface IDashboardProps {
  user: IUser,
  isAuthenticated: boolean
}

export default function Dashboard({ user, ...props }: IDashboardProps) {
  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl text-accent pl-4 font-semibold'>Dashboard</h1>
      <div className='hidden md:block'>
        <SimpleGrid className='pl-8 pr-12' columns={2}>
          <Box>
            <Dailies user={user} />
            <News user={user} />
          </Box>
          <Box>
            <Shouts user={user} />
          </Box>
        </SimpleGrid>
      </div>
      <div className='block md:hidden'>
        <Dailies user={user} />
        <News user={user} />
        <Shouts user={user} />
      </div>
    </Layout>
  ): null;
}

export const getServerSideProps = async ctx => {
  const { req } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      }
    };
  }

  return {
    props: { ...result },
  };
}