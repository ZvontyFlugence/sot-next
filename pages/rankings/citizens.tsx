import Layout from '@/components/Layout';
import Select from '@/components/Select';
import Country, { ICountry } from '@/models/Country';
import { IUser, IUserStats } from '@/models/User';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { CitizenStats } from '@/util/constants';
import { request } from '@/util/ui';
import { Avatar, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'node:querystring';
import { destroyCookie } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface ICitizenRankings {
  user: IUser;
  isAuthenticated: boolean;
  countries: ICountry[];
}

const buildRequestURL = (query: ParsedUrlQuery): string => {
  const { scope, stat, country } = query;

  if (scope === 'global' || scope === 'country' && stat) {
    if (scope === 'global' && !country)
      return `/api/stats/user?scope=${scope}&stat=${stat}&sort=desc`;
    else if (scope === 'country' && country)
      return `/api/stats/user?scope=${scope}&country=${country}&stat=${stat}&sort=desc`
  }

  return '/api/stats/user?scope=global&stat=xp';
}

// URL => `/rankings/citizens?scope=[scopeType]&country=[countryId]&stat=[statType]
// TODO: Add pagination
export default function CitizenRankings({ user, countries, ...props }: ICitizenRankings) {
  const router = useRouter();
  const [citizens, setCitizens] = useState<IUserStats[]>([]);

  useEffect(() => {
    request({
      url: buildRequestURL(router.query),
      method: 'GET',
    }).then(data => setCitizens(data.citizens ?? []));
  }, [router.query]);

  const updateCountry = (value: number | string) => {
    if (value === 'global')
      router.push(`/rankings/citizens?scope=global&stat=${(router.query?.stat as string) ?? 'xp'}`);
    else
      router.push(`/rankings/citizens?scope=country&country=${value}&stat=${(router.query?.stat as string) ?? 'xp'}`);
  }

  const updateStat = (value: number | string) => {
    const { scope, country } = router.query;
    
    if (scope === 'global' || !country)
      router.push(`/rankings/citizens?scope=global&stat=${value}`);
    else
      router.push(`/rankings/citizens?scope=country&country=${country as string}&stat=${value}`);
  }

  return user ? (
    <Layout user={user}>
      <h1 className='flex justify-between pl-4 pr-20'>
        <span className='text-2xl font-semibold text-accent'>Citizen Rankings</span>
        <div className='flex justify-end items-center gap-4'>
          {countries.length > 0 && (
            <Select selected={(router.query?.country as string) ?? 'global'} onChange={updateCountry}>
              <Select.Option value='global'>Global</Select.Option>
              {countries.map((country: ICountry, i: number) => (
                <Select.Option key={i} value={`${country._id}`}>
                  {country.name}
                  <i className={`ml-2 flag-icon flag-icon-${country.flag_code} rounded shadow-md`} />
                </Select.Option>
              ))}
            </Select>
          )}

          <Select selected={(router.query?.stat as string) ?? 'xp'} onChange={updateStat}>
            {Object.values(CitizenStats).map((stat: string, i: number) => (
              <Select.Option key={i} value={stat}>
                <span className={`${stat === 'xp' ? 'uppercase' : 'capitalize'}`}>{stat}</span>
              </Select.Option>
            ))}
          </Select>
        </div>
      </h1>
      <div className='mx-12 mt-4 p-2 bg-night rounded shadow-md'>
        {citizens.length === 0 ? (
          <p className='text-white'>No Citizens Found</p>
        ) : (
          <Table variant='unstyled' bgColor='night' color='white'>
            <Thead>
              <Tr>
                <Th color='white'>Rank</Th>
                <Th color='white'>Citizen</Th>
                <Th color='white'>Country</Th>
                <Th color='white'>{(router.query?.stat as string) ?? 'xp'}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {citizens.map((us: IUserStats, i: number) => (
                <Tr key={i}>
                  <Td className='text-xl font-semibold'>{i + 1}</Td>
                  <Td>
                    <div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/profile/${us._id}`)}>
                      <Avatar src={us.image} name={us.username} />
                      {us.username}
                    </div>
                  </Td>
                  <Td>
                    <div className='flex items-center cursor-pointer text-4xl' onClick={() => router.push(`/country/${us.country._id}`)}>
                      <i className={`flag-icon flag-icon-${us.country.flag_code} rounded shadow-md`} title={us.country.name} />
                    </div>
                  </Td>
                  <Td className='text-xl font-semibold'>{us[(router.query?.stat as string) ?? 'xp']}</Td>
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
  let { req, res } = ctx;

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