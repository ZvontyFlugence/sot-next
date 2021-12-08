import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { useUser } from '@/context/UserContext';
import Country, { ICountry } from '@/models/Country';
import { IParty } from '@/models/Party';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { request } from '@/util/ui';
import { Avatar, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface IPartyRankings {
  countries: ICountry[];
  scope: string;
}

// URL => `/rankings/parties` || `/rankings/parties?country=[countryId]`
// TODO: Add pagination
export default function PartyRankings({ countries, scope }: IPartyRankings) {
  const cookies = parseCookies();
  const router = useRouter();
  const user = useUser();

  const [parties, setParties] = useState<IParty[]>([]);

  useEffect(() => {
    request({
      url: `/api/parties${scope !== 'global' ? `?country=${scope}` : ''}`,
      method: 'GET',
      token: cookies.token,
    })
      .then(data => setParties(data.payload.parties ?? []));
  }, [scope]);

  const goToRankings = (val: number | string) => {
    if (val && val !== scope) {
      router.push(`/rankings/parties${val !== 'global' ? `?country=${val}` : ''}`);
    }
  }

  return user ? (
    <Layout user={user}>
      <h1 className='flex justify-between pl-4 pr-20'>
        <span className='text-2xl font-semibold text-accent'>Party Rankings</span>
        <div>
            <Select selected={scope} onChange={val => goToRankings(val)}>
              {([null] as any[]).concat(countries).map((c, i) => (
                <Select.Option key={i} value={c ? `${c._id}` : 'global'}>
                  {c ? (
                    <>
                      {c.name}
                      <i className={`ml-2 sot-flag sot-flag-${c.flag_code}`} />
                    </>
                  ) : <>Global</>}
                </Select.Option>
              ))}
            </Select>
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
                {scope === 'global' && (
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
                  {scope === 'global' && (
                    <Td className='text-xl font-semi items-center cursor-pointer' onClick={() => router.push(`/country/${party.country}`)}>
                      <i className={`sot-flag sot-flag-${countries[party.country - 1]?.flag_code}`} />
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, res, query } = ctx;

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
  
  let scope: string = 'global';
  if (query?.country) {
    scope = query.country as string;
  }

  return {
    props: {
      countries: jsonify(countries),
      scope,
    },
  };
}