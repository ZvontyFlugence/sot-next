import { destroyCookie } from 'nookies';
import { getCurrentUser } from '@/util/auth';
import { Box, SimpleGrid } from '@chakra-ui/layout';
import Dailies from '@/components/dashboard/Dailies';
import Shouts from '@/components/dashboard/Shouts';
import News from '@/components/dashboard/News';
import Layout from '@/components/Layout';
import ElectionMsg from '@/components/dashboard/ElectionMsg';
import { GetServerSideProps } from 'next';
import { useUser } from '@/context/UserContext';

export default function Dashboard() {
  let date: Date = new Date(Date.now());
  const user = useUser();

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl text-accent pl-4 font-semibold'>Dashboard</h1>
      <div className='hidden md:block'>
        <ElectionMsg
          country={user.country}
          party={user.party}
          day={date.getUTCDate()}
          month={date.getUTCMonth() + 1}
          year={date.getUTCFullYear()}
        />
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

export const getServerSideProps: GetServerSideProps = async ctx => {
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
    props: {},
  };
}