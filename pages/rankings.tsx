import Layout from '@/components/Layout';
import { useUser } from '@/context/UserContext';
import { getCurrentUser } from '@/util/auth';
import { RANKING_TYPES } from '@/util/constants';
import { IRankingType } from '@/util/ui';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie } from 'nookies';

export default function Rankings() {
  const router = useRouter();
  const user = useUser();

  const getRankingTypeCard = (rankingType: IRankingType) => (
    <div
      className='flex justify-center bg-night rounded shadow-md px-4 py-2 text-white cursor-pointer'
      onClick={() => router.push(rankingType.route)}
    >
      {rankingType.label}
    </div>
  );

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl text-accent pl-4 font-semibold'>Rankings</h1>
      <div className='grid grid-cols-3 gap-4 mr-8 mt-4'>
        {Object.values(RANKING_TYPES).map(type => getRankingTypeCard(type))}
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie({ res }, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  return {
    props: {},
  }
}