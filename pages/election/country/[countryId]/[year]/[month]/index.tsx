import Layout from '@/components/Layout';
import Election, { ECVote, ElectionType, ICandidate, IElection } from '@/models/Election';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { findVote, jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { refreshData, request, showToast } from '@/util/ui';
import { Table, Thead, Tr, Th, Tbody, Td, Avatar, Button, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import React from 'react';

interface ICPElection {
  user?: IUser,
  isAuthenticated: boolean,
  election: IElection,
}

const CPElection: React.FC<ICPElection> = ({ user, election, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

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
      return can.votes.findIndex((vote: number | ECVote) =>  findVote(vote, user._id)) >= 0;
    });

    return foundVote.some(vote => vote === true);
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-xl text-accent h-brand font-semibold'>
        Country President Election: {election?.month}/5/{election?.year}
      </h1>
      <div className='mt-4 mr-8 p-4 bg-night rounded shadow-md text-white'>
        <h3 className='text-lg text-accent h-brand font-semibold'>Candidates</h3>
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
                  {new Date(Date.now()).getUTCDate() === 5 && (
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

  let country: number = Number.parseInt(params.countryId);
  let year: number = Number.parseInt(params.year);
  let month: number = Number.parseInt(params.month);

  let query = {
    type: ElectionType.CountryPresident,
    typeId: country,
    year,
    month,
  };

  let election: IElection = await Election.findOne(query).exec();
  if (!election.isActive && election.isCompleted) {
    return {
      redirect: {
        permanent: false,
        destination: `/election/country/${country}/${year}/${month}/results`,
      },
    };
  } else if (!election) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  return {
    props: {
      ...result,
      election: jsonify(election),
    }
  }
}

export default CPElection;