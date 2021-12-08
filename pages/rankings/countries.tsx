import Layout from '@/components/Layout';
import { useUser } from '@/context/UserContext';
import { ICountryStats } from '@/models/Country';
import { getCurrentUser } from '@/util/auth';
import { request } from '@/util/ui';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie } from 'nookies';
import { useEffect, useState } from 'react';

// URL => `/rankings/countries`
// TODO: Add pagination
export default function CountryRankings() {
  const router = useRouter();
  const user = useUser();

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
                    <span className='sot-flag-wrap'>
                      <i className={`sot-flag sot-flag-${cs.flag_code} h-12`} />
                    </span>
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
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
    props: {},
  };
}