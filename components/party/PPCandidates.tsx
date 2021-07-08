import { ICandidate, IElection } from '@/models/Election';
import { IParty } from '@/models/Party';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';

interface IPPCandidates {
  user_id: number,
  party: IParty,
}

const PPCandidates: React.FC<IPPCandidates> = ({ user_id, party }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [cp, setCP] = useState<IUser>();
  const [congress, setCongress] = useState<number[]>([]);
  const [election, setElection] = useState<IElection>();

  let date: Date = new Date(Date.now());
  let year: number = date.getUTCDate() > 15 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
  let month: number = date.getUTCDate() <= 15 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;
  let cantRun: boolean = party.president === user_id;

  useEffect(() => {
    request({
      url: `/api/countries/${party.country}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.country?.government.president) {
        request({
          url: `/api/users/${data.country.government.president}`,
          method: 'GET',
          token: cookies.token,
        }).then(resp => {
          if (resp.success)
            setCP(resp.user);
        });
      }

      if (data.country?.government.congress)
        setCongress(data.country?.government.congress);
    });

    request({
      url: `/api/elections/party/${party._id}/${year}/${month}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.election)
        setElection(data.election);
    });
  }, [party.country, year, month]);

  const submitCandidacy = () => {
    let payload = {
      action: UserActions.RUN_FOR_PP,
      data: { partyId: party._id },
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
        showToast(toast, 'error', 'Submit Candidacy Failed', data?.error);
      }
    });
  }

  return (
    <>
      <div className='hidden md:flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl text-accent font-semibold'>
            Party President Election: {month}/15/{year}
          </h2>
          <Button size='sm' colorScheme='blue' onClick={submitCandidacy} disabled={cantRun || election?.candidates.findIndex(can => can.id === user_id) >= 0}>Run</Button>
        </div>
        <div>
          <h3 className='text-lg text-accent-alt font-semibold'>Party Candidates:</h3>
          {election?.candidates.length > 0 ? (
            election.candidates.map((candidate: ICandidate, i: number) => (
              <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${candidate.id}`)}>
                <Avatar src={candidate.image} name={candidate.name} />
                <span className='font-semibold'>{candidate.name}</span>
              </div>
            ))
          ) : (
            <p>Party Has No Candidates for Party President</p>
          )}
        </div>
      </div>
      <div className='flex md:hidden flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
        <div>
          <h3 className='text-xl text-accent font-semibold'>Party Candidates:</h3>
          {election?.candidates.length > 0 ? (
            election.candidates.map((candidate: ICandidate, i: number) => (
              <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${candidate.id}`)}>
                <Avatar src={candidate.image} name={candidate.name} />
                <span className='font-semibold'>{candidate.name}</span>
              </div>
            ))
          ) : (
            <p>Party Has No Candidates For Party President</p>
          )}
        </div>
      </div>
    </>
  );
}

export default PPCandidates;