import Layout from '@/components/Layout';
import Select from '@/components/Select';
import Country, { ICountry } from '@/models/Country';
import { IParty } from '@/models/Party';
import { IUser } from '@/models/User';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { request } from '@/util/ui';
import { Avatar, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface IPartyRankings {
  user: IUser;
  isAuthenticated: boolean;
  countries: ICountry[];
}

// URL => `/rankings/parties` || `/rankings/parties?country=[countryId]`
// TODO: Add pagination
export default function PartyRankings({ user, countries, ...props }: IPartyRankings) {
  const cookies = parseCookies();
  const router = useRouter();
  const [parties, setParties] = useState<IParty[]>([]);

  useEffect(() => {
    const countryId = (router.query?.country as string) ?? 'global';
    request({
      url: `/api/parties${countryId !== 'global' ? `?country=${countryId}` : ''}`,
      method: 'GET',
      token: cookies.token,
    })
      .then(data => setParties(data.parties ?? []));
  }, [router.query]);

  const goToRankings = (val: number | string) => {
    router.push(`/rankings/parties${val !== 'global' ? `?country=${val}` : ''}`);
  }

  return user ? (
    <Layout user={user}>
      <h1 className='flex justify-between pl-4 pr-20'>
        <span className='text-2xl font-semibold text-accent'>Party Rankings</span>
        <div>
          {countries.length > 0 && (
            <Select selected={(router.query?.country as string) ?? 'global'} onChange={goToRankings}>
              <Select.Option value='global'>Global</Select.Option>
              {countries.map((country: ICountry, i: number) => (
                <Select.Option key={i} value={`${country._id}`}>
                  {country.name}
                  <i className={`ml-2 flag-icon flag-icon-${country.flag_code}`} />
                </Select.Option>
              ))}
            </Select>
          )}
        </div>
      </h1>
      <div className='mx-12 mt-4 p-2 bg-night rounded shadow-md'>
        {parties.length === 0 ? (
          <p className='text-white'>Country has no political parties</p>
        ) : (
          <Table variant='unstyled' bgColor='night' color='white'>
            <Thead>
              <Tr>
                <Th color='white'>Rank</Th>
                <Th color='white'>Party</Th>
                {!router.query?.country && (
                  <Th color='white'>Country</Th>
                )}
                <Th color='white'>Members</Th>
              </Tr>
            </Thead>
            <Tbody>
              {parties.sort((a: IParty, b: IParty) => b.members.length - a.members.length).map((party: IParty, i: number) => (
                <Tr key={i}>
                  <Td className='text-xl font-semibold'>{i + 1}</Td>
                  <Td>
                    <div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/party/${party._id}`)}>
                      <Avatar src={party.image} name={party.name} />
                      {party.name}
                    </div>
                  </Td>
                  {!router.query?.country && (
                    <Td>
                      <div className='flex items-center cursor-pointer text-4xl' onClick={() => router.push(`/country/${party.country}`)}>
                        <i className={`flag-icon flag-icon-${countries[party.country - 1].flag_code} rounded shadow-md`} title={countries[party.country - 1].name} />
                      </div>
                    </Td>
                  )}
                  <Td className='text-xl font-semibold'>{party.members.length}</Td>
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