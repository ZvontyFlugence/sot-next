import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { useUser } from '@/context/UserContext';
import { ICountry } from '@/models/Country';
import Election, { ElectionType, ICandidate, IElection } from '@/models/Election';
import Party, { IParty } from '@/models/Party';
import { UserActions } from '@/util/actions';
import { findVote, jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, Table, Tbody, Td, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface IPartyElection {
  election: IElection,
  country: number,
}

const PartyElection: React.FC<IPartyElection> = ({ election, country: countryId }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const user = useUser();

  const [country, setCountry] = useState<number>(countryId);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [selectedParty, setSelectedParty] = useState<number>(election.typeId);
  const [parties, setParties] = useState<IParty[]>([]);

  useEffect(() => {
    request({
      url: `/api/countries/${country}/parties`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.parties)
        setParties(
          data.parties.sort((a: IParty, b: IParty) => a.name.localeCompare(b.name))
        );
    });

    request({
      url: '/api/countries',
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.countries)
        setCountries(
          data.countries.sort((a: ICountry, b: ICountry) => a.name.localeCompare(b.name))
        );
    });
  }, []);

  useEffect(() => {
    request({
      url: `/api/countries/${country}/parties`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.parties)
        setParties(
          data.parties.sort((a: IParty, b: IParty) => a.name.localeCompare(b.name))
        );
    });
  }, [country]);

  const goToElection = () => {
    router.push(`/election/party/${selectedParty}/${election.year}/${election.month}`);
  }

  const handleVote = (candidate: number) => {
    let payload = {
      action: UserActions.VOTE,
      data: {
        candidate,
        election: election._id,
        location: user.residence,
      },
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
          Party Election: {election?.month}/15/{election?.year}
        </h1>
        <div className='flex items-center gap-4 pr-8'>
          {countries.length > 0 && (
            <Select className='border border-white border-opacity-25 rounded shadow-md' selected={country} onChange={(val) => setCountry(val as number)}>
              {countries.map((country: ICountry, i: number) => (
                <Select.Option key={i} value={country._id}>
                  {country.name}
                  <i className={`ml-2 sot-flag sot-flag-${country.flag_code}`} />
                </Select.Option>
              ))}
            </Select>
          )}
          {selectedParty && parties.length > 0 && (
            <Select className='border border-white border-opacity-25 rounded shadow-md' selected={selectedParty} onChange={(val) => setSelectedParty(val as number)}>
                {parties.map((party: IParty, i: number) => (
                  <Select.Option key={i} value={party._id}>
                    <Avatar src={party.image} name={party.name} />
                    {party.name}
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
                      disabled={hasUserVoted() || user.party !== can.party}
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

export const getServerSideProps: GetServerSideProps = async ctx => {
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

  let partyId: number = Number.parseInt(params.partyId as string);
  let year: number = Number.parseInt(params.year as string);
  let month: number = Number.parseInt(params.month as string);

  let query = {
    type: ElectionType.PartyPresident,
    typeId: partyId,
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
        destination: `/election/party/${partyId}/${year}/${month}/results`,
      },
    };
  }

  let party: IParty = await Party.findOne({ _id: election.typeId }).exec();

  return {
    props: {
      election: jsonify(election),
      country: jsonify(party.country),
    },
  };
}

export default PartyElection;