import { ICandidate, IElection } from '@/models/Election';
import { IParty } from '@/models/Party';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface ICongressCandidates {
  user_id: number,
  party: IParty,
}

const CongressCandidates: React.FC<ICongressCandidates> = ({ user_id, party }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [election, setElection] = useState<IElection>();
  const [candidates, setCandidates] = useState<ICandidate[]>([]);
  const [cp, setCP] = useState<number | null>(null);
  const [congress, setCongress] = useState<number[]>([]);


  let date: Date = new Date(Date.now());
  let year: number = date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
  let month: number = date.getUTCDate() <=5 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;
  const canRun: boolean = party.president === user_id || party.congressCandidates.findIndex(can => can.id === user_id) >= 0 || cp === user_id;

  useEffect(() => {
    // TODO: Parallel Request for Active Party Congressmen and CP
    request({
      url: `/api/countries/${party.country}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.country) {
        let president = data.country.government.president;
        if (president !== -1)
          setCP(president);
        setCongress(data.country.government.congress);
      }
    });

    request({
      url: `/api/elections/congress/${party.country}/${year}/${month}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.election) {
        setElection(data.election);
        setCandidates(data.election.candidates);
      }
    });
  }, [party.country, year, month]);

  const runForCongress = () => {
    let payload = {
      action: UserActions.RUN_FOR_CONGRESS,
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
        <h2 className='text-xl text-accent font-semibold'>
          Congressional Election: {month}/25/{year}
        </h2>
        <div>
          Active Congress Members: {congress.filter(u => party.members.includes(u)).length}
        </div>
        <div>
          <h3 className='flex justify-between items-center'>
            <span className='text-lg text-accent-alt font-semibold'>Party Candidates:</span>
            <Button size='sm' colorScheme='blue' onClick={runForCongress} disabled={canRun || election?.isActive}>Run</Button>
          </h3>
          {party.congressCandidates.length === 0 ? (
            <p>Party Has No Candidates for Congress</p>
          ) : party.congressCandidates.map((candidate: ICandidate, i: number) => (
            <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${candidate.id}`)}>
              <Avatar src={candidate.image} name={candidate.name} />
              <span className='font-semibold'>{candidate.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className='flex md:hidden flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
        <div>
          Active Congress Members: 0
        </div>
        <div>
          <h3 className='text-xl text-accent-alt font-semibold'>Party Candidates:</h3>
          {party.congressCandidates.length === 0 ? (
            <p>Party Has No Candidates for Congress</p>
          ) : party.congressCandidates.map((candidate: ICandidate, i: number) => (
            <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${candidate.id}`)}>
              <Avatar src={candidate.image} name={candidate.name} />
              <span className='font-semibold'>{candidate.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CongressCandidates;