import Layout from '@/components/Layout';
import Select from '@/components/Select';
import Country, { ICountry } from '@/models/Country';
import { INewspaper } from '@/models/Newspaper';
import { IUser } from '@/models/User';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { request } from '@/util/ui';
import { Avatar, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface INewsRankings {
  user: IUser;
  isAuthenticated: boolean;
  countries: ICountry[];
}

// URL => `/rankings/newspapers` || `/rankings/newspapers?country=[countryId]`
// TODO: Add pagination
export default function NewsRankings({ user, countries, ...props }: INewsRankings) {
  const cookies = parseCookies();
  const router = useRouter();
  const [newspapers, setNewspapers] = useState<INewspaper[]>([]);

  useEffect(() => {
    const countryId = (router.query?.country as string) ?? 'global';
    request({
      url: `/api/newspapers${countryId !== 'global' ? `?country=${countryId}` : ''}`,
      method: 'GET',
      token: cookies.token,
    })
      .then(data => setNewspapers(data.newspapers ?? []));
  }, [router.query]);

  const goToRankings = (val: number | string) => {
    router.push(`/rankings/newspapers${val !== 'global' ? `?country=${val}` : ''}`);
  }

  return user ? (
    <Layout user={user}>
      <h1 className='flex justify-between pl-4 pr-20'>
        <span className='text-2xl font-semibold text-accent'>News Rankings</span>
        <div>
          {countries.length > 0 && (
            <Select selected={(router.query?.country as string) ?? 'global'} onChange={goToRankings}>
              <Select.Option value='global'>Global</Select.Option>
              {countries.map((country: ICountry, i: number) => (
                <Select.Option key={i} value={`${country._id}`}>
                  {country.name}
                  <i className={`ml-2 flag-icon flag-icon-${country.flag_code} rounded shadow-md`} />
                </Select.Option>
              ))}
            </Select>
          )}
        </div>
      </h1>
      <div className='mx-12 mt-4 p-2 bg-night rounded shadow-md'>
        {newspapers.length === 0 ? (
          <p className='text-white'>Country has no newspapers</p>
        ) : (
          <Table variant='unstyled' bgColor='night' color='white'>
            <Thead>
              <Tr>
                <Th color='white'>Rank</Th>
                <Th color='white'>Newspaper</Th>
                <Th color='white'>Subscribers</Th>
              </Tr>
            </Thead>
            <Tbody>
              {newspapers.sort((a: INewspaper, b: INewspaper) => b.subscribers.length - a.subscribers.length).map((news: INewspaper, i: number) => (
                <Tr key={i}>
                  <Td className='text-xl font-semibold'>{i + 1}</Td>
                  <Td>
                    <div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/newspaper/${news._id}`)}>
                      <Avatar src={news.image} name={news.name} />
                      {news.name}
                    </div>
                  </Td>
                  <Td className='text-xl font-semibold'>{news.subscribers.length}</Td>
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

  let countries: ICountry[] = await Country.find({}).exec();

  return {
    props: {
      ...result,
      countries: jsonify(countries),
    },
  };
}