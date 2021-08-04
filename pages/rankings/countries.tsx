import Layout from '@/components/Layout';
import { ICountryStats } from '@/models/Country';
import { IUser } from '@/models/User';
import { getCurrentUser } from '@/util/auth';
import { request } from '@/util/ui';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie } from 'nookies';
import { useEffect, useState } from 'react';

interface ICountryRankings {
  user: IUser;
  isAuthenticated: boolean;
}

// URL => `/rankings/countries`
// TODO: Add pagination
export default function CountryRankings({ user, ...props }: ICountryRankings) {
  const router = useRouter();
  const [countries, setCountries] = useState<ICountryStats[]>([]);

  useEffect(() => {
    request({
      url: '/api/stats/country?stat=population',
      method: 'GET',
    }).then(data => setCountries(data.countries ?? []));
  }, []);

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl font-semibold text-accent'>Country Rankings</h1>
      <div className='mx-12 mt-4 p-2 bg-night rounded shadow-md'>
        {countries.length === 0 ? (
          <p className='text-white'>No Countries Found</p>
        ) : (
          <Table variant='unstyled' bgColor='night' color='white'>
            <Thead>
              <Tr>
                <Th color='white'>Rank</Th>
                <Th color='white'>Country</Th>
                <Th color='white'>Population</Th>
              </Tr>
            </Thead>
            <Tbody>
              {countries.map((cs: ICountryStats, i: number) => (
                <Tr key={i}>
                  <Td className='text-xl font-semibold'>{i + 1}</Td>
                  <Td className='flex items-center gap-2 cursor-pointer text-2xl' onClick={() => router.push(`/country/${cs._id}`)}>
                    <i className={`flag-icon flag-icon-${cs.flag_code} shadow-md rounded`} />
                    {cs.name}
                  </Td>
                  <Td className='text-xl font-semibold'>{cs.population}</Td>
                </Tr>
              ))}
            </Tbody>
            
          </Table>
        )}
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