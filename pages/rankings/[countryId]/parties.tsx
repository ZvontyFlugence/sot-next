import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { ICountry } from '@/models/Country';
import { IParty } from '@/models/Party';
import { IUser } from '@/models/User';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { refreshData, request } from '@/util/ui';
import { Avatar, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface IPartyRankings {
  user: IUser;
  isAuthenticated: boolean;
  countryId: number | string;
}

const PartyRankings: React.FC<IPartyRankings> = ({ user, countryId, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [parties, setParties] = useState<IParty[]>([]);

  useEffect(() => {
    request({
      url: '/api/countries',
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.countries) {
        setCountries(data.countries.sort((a: ICountry, b: ICountry) => a.name.localeCompare(b.name)));
      }
    });

    request({
      url: `/api/parties${countryId !== 'global' && `?country=${countryId}` }`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      setParties(data.parties ?? []);
    });
  }, [countryId]);

  const goToRankings = (val: number | string) => {
    router.push(`/rankings/${val}/parties`);
  }

  return user ? (
    <Layout user={user}>
      <h1 className='flex justify-between pl-4 pr-8'>
        <span className='text-2xl font-semibold text-accent'>Party Rankings</span>
        <div>
          {countries.length > 0 && (
            <Select selected={countryId} onChange={(val) => goToRankings(val)}>
              {countries.map((country: ICountry, i: number) => (
                <Select.Option key={i} value={country._id}>
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
          <Table bgColor='night' color='white'>
            <Thead>
              <Tr>
                <Th color='white'>Rank</Th>
                <Th color='white'>Party</Th>
                <Th color='white'>Members</Th>
              </Tr>
            </Thead>
            <Tbody>
              {parties.sort((a: IParty, b: IParty) => b.members.length - a.members.length).map((party: IParty, i: number) => (
                <Tr key={i}>
                  <Td className='text-xl font-semibold'>{i + 1}</Td>
                  <Td className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/party/${party._id}`)}>
                    <Avatar src={party.image} name={party.name} />
                    {party.name}
                  </Td>
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

export const getServerSideProps = async ctx => {
  let { req, params } = ctx;

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

  let countryId: number | string = 'global';
  try {
    countryId = Number.parseInt(params.countryId as string);
  } catch (e) {}

  return {
    props: {
      ...result,
      countryId: jsonify(countryId),
    },
  };
}

export default PartyRankings;