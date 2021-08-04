import Layout from '@/components/Layout';
import { ElectionType } from '@/models/Election';
import { IUser } from '@/models/User';
import { getCurrentUser } from '@/util/auth';
import { useRouter } from 'next/router';
import { destroyCookie } from 'nookies';

interface IElectionsProps {
  user: IUser;
  isAuthenticated: boolean;
}

export default function Elections({ user, ...props }: IElectionsProps) {
  const router = useRouter();

  const getElectionTypeCard = (electionType: ElectionType) => (
    <div
      className='flex justify-center bg-night rounded shadow-md px-4 py-2 text-white cursor-pointer'
      onClick={() => goToElection(electionType)}
    >
      {electionType}
    </div>
  );

  const goToElection = (type: ElectionType) => {
    let now = new Date(Date.now());

    switch (type) {
      case ElectionType.Congress: {
        let month = now.getUTCDate() <= 25 ? ((now.getUTCMonth() -1) % 12) + 1  : now.getUTCMonth() + 1;
        return `/election/congress/${user.residence}/${now.getUTCFullYear()}/${month}`;
      }
      case ElectionType.CountryPresident: {
        let month = now.getUTCDate() <= 5 ? ((now.getUTCMonth() -1) % 12) + 1  : now.getUTCMonth() + 1;
        return `election/country/${user.country}/${now.getUTCFullYear()}/${month}`;
      }
      case ElectionType.PartyPresident: {
        let month = now.getUTCDate() <= 15 ? ((now.getUTCMonth() -1) % 12) + 1  : now.getUTCMonth() + 1;
        return `election/party/${user.party > 0 ? user.party : 1}/${now.getUTCFullYear()}/${month}`;
      }
    }
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl text-accent pl-4 font-semibold'>Elections</h1>
      <div className='grid grid-cols-3 gap-8 mt-4 mr-8'>
        {Object.values(ElectionType).map((type: string) => getElectionTypeCard(type as ElectionType))}
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async (ctx) => {
  const { req, res } = ctx;

  const result = await getCurrentUser(req);
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
    props: { ...result },
  };
}