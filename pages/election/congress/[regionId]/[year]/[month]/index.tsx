import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { ICountry } from '@/models/Country';
import Election, { ElectionType, ICandidate, IElection } from '@/models/Election';
import Region, { IRegion } from '@/models/Region';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { findVote, jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, Table, Tbody, Td, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface ICongressElection {
  user?: IUser,
  isAuthenticated: boolean,
  election: IElection,
  country: number,
}

const CongressElection: React.FC<ICongressElection> = ({ user, election, country: countryId, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [country, setCountry] = useState<number>(countryId);
  const [selectedRegion, setSelectedRegion] = useState<number>(election.typeId);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [regions, setRegions] = useState<IRegion[]>([]);

  useEffect(() => {
    request({
      url: `/api/countries/${country}/regions`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.regions) {
        setRegions(data.regions.sort((a: IRegion, b: IRegion) => {
          if (a.name < b.name)
            return -1;
          else if (a.name > b.name)
            return 1;
          
          return 0;
        }));
      }
    });

    request({
      url: '/api/countries',
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.countries)
        setCountries(data.countries.sort((a: IRegion, b: IRegion) => {
          if (a.name < b.name)
            return -1;
          else if (a.name > b.name)
            return 1;
          
          return 0;
        }));
    });
  }, []);

  useEffect(() => {
    request({
      url: `/api/countries/${country}/regions`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.regions) {
        setRegions(data.regions.sort((a: IRegion, b: IRegion) => {
          if (a.name < b.name)
            return -1;
          else if (a.name > b.name)
            return 1;
          
          return 0;
        }));
      }
    })
  }, [country]);

  const goToElection = () => {
    router.push(`/election/congress/${selectedRegion}/${election.year}/${election.month}`);
  }

  const handleVote = (candidate: number) => {
    let payload = {
      action: UserActions.VOTE,
      data: { candidate, location: user.location, election: election._id },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Failed to Vote', data?.error);
      }
    });
  }

  const hasUserVoted = (): boolean => {
    let foundVote: boolean[] = election?.candidates.map((can: ICandidate) => {
      return (can.votes as number[]).findIndex((vote: number) => findVote(vote, user._id)) >= 0;
    });

    return foundVote.some(vote => vote === true);
  }

  return user ? (
    <Layout user={user}>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl text-accent font-semibold'>
          Congress Election: {election?.month}/25/{election?.year}
        </h1>
        <div className='flex items-center gap-4 pr-8'>
          {countries.length > 0 && (
            <Select className='border border-white border-opacity-25 rounded shadow-md' selected={country} onChange={(val) => setCountry(val as number)}>
              {countries.map((country: ICountry, i: number) => (
                <Select.Option key={i} value={country._id}>
                  {country.name}
                  <i className={`ml-2 flag-icon flag-icon-${country.flag_code}`} />
                </Select.Option>
              ))}
            </Select>
          )}
          {selectedRegion && regions.length > 0 && (
            <Select className='border border-white border-opacity-25 rounded shadow-md' selected={selectedRegion} onChange={(val) => setSelectedRegion(val as number)}>
                {regions.map((region: IRegion, i: number) => (
                  <Select.Option key={i} value={region._id}>
                    {region.name}
                  </Select.Option>
                ))}
            </Select>
          )}
          <Button size='sm' colorScheme='blue' onClick={goToElection}>Go</Button>
        </div>
      </div>
      <div className='mt-4 mr-8 p-4 bg-night rounded shadow-md text-white'>
        <h3 className='text-lg text-accent font-semibold'>Candidates</h3>
        <Table>
          <Thead>
            <Tr>
              <Th color='white'>Candidate</Th>
              <Th color='white'>Party</Th>
              <Th color='white'>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {election?.candidates.map((can: ICandidate, i: number) => (
              <Tr key={i}>
                <Td>
                  <div className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${can.id}`)}>
                    <Avatar src={can.image} name={can.name} />
                    <span>{can.name}</span>
                  </div>
                </Td>
                <Td>
                  <div className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/party/${can.party}`)}>
                    <Avatar src={can.partyImage} name={can.partyName} />
                    <span>{can.partyName}</span>
                  </div>
                </Td>
                <Td>
                  {new Date(Date.now()).getUTCDate() === 25 && (
                    <Button
                      size='sm'
                      colorScheme='blue'
                      onClick={() => handleVote(can.id)}
                      disabled={hasUserVoted() || user.location !== user.residence}
                    >
                      Vote
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
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

  let regionId: number = Number.parseInt(params.regionId);
  let year: number = Number.parseInt(params.year);
  let month: number = Number.parseInt(params.month);

  let query = {
    type: ElectionType.Congress,
    typeId: regionId,
    year,
    month,
  };

  let election: IElection = await Election.findOne(query).exec();
  if (!election) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  } else if (!election.isActive && election.isCompleted) {
    return {
      redirect: {
        permanent: false,
        destination: `/election/congress/${regionId}/${year}/${month}/results`,
      },
    };
  }

  let region: IRegion = await Region.findOne({ _id: election.typeId }).exec();

  return {
    props: {
      ...result,
      election: jsonify(election),
      country: jsonify(region.owner),
    },
  };
}

export default CongressElection;