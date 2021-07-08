import { ICandidate, IElection } from '@/models/Election';
import { IParty } from '@/models/Party';
import { UserActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, Tag, useToast } from '@chakra-ui/react';
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

  const [candidates, setCandidates] = useState<ICandidate[]>([]);
  const [cp, setCP] = useState<number | null>(null);
  const [congress, setCongress] = useState<number[]>([]);


  let date: Date = new Date(Date.now());
  let year: number = date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
  let month: number = date.getUTCDate() <=5 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;
  const canRun: boolean = party.president === user_id || party.congressCandidates.findIndex(can => can.id === user_id) >= 0 || cp === user_id;

  useEffect(() => {
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
      url: `/api/elections/congress/${party.country}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.elections) {
        setCandidates(data.elections.reduce((accum: ICandidate[], election: IElection) => {
          return [...accum, ...election.candidates];
        }, []));
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
            <Button size='sm' colorScheme='blue' onClick={runForCongress} disabled={canRun}>Run</Button>
          </h3>
          {party.congressCandidates.length === 0 ? (
            <p>Party Has No Candidates for Congress</p>
          ) : party.congressCandidates.map((candidate: ICandidate, i: number) => (
            <div key={i} className='flex items-center gap-8'>
              <div className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${candidate.id}`)}>
                <Avatar src={candidate.image} name={candidate.name} />
                <div className='flex flex-col'>
                  <span className='font-semibold'>{candidate.name}</span>
                  {candidates.findIndex(can => can.id === candidate.id) !== -1 && (
                    <Tag size='sm' variant='subtle' colorScheme='gray'>OFFICIAL</Tag>
                  )}
                </div>
              </div>
              <Tag
                className='cursor-pointer'
                variant='subtle'
                colorScheme='cyan'
                onClick={() => router.push(`/region/${candidate.location}`)}
              >
                {candidate.locationName}
              </Tag>
            </div>
          ))}
        </div>
      </div>
      <div className='flex md:hidden flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
        <div>
          Active Congress Members: {congress.filter(u => party.members.includes(u)).length}
        </div>
        <div>
          <h3 className='text-xl text-accent-alt font-semibold'>Party Candidates:</h3>
          {party.congressCandidates.length === 0 ? (
            <p>Party Has No Candidates for Congress</p>
          ) : party.congressCandidates.map((candidate: ICandidate, i: number) => (
            <div key={i} className='flex items-center gap-4'>
              <div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/profile/${candidate.id}`)}>
                <Avatar src={candidate.image} name={candidate.name} />
                <div className='flex flex-col'>
                  <span className='font-semibold'>{candidate.name}</span>
                  {candidates.findIndex(can => can.id === candidate.id) !== -1 && (
                    <Tag size='sm' variant='subtle' colorScheme='gray'>OFFICIAL</Tag>
                  )}
                </div>
              </div>
              <Tag
                className='cursor-pointer'
                variant='subtle'
                colorScheme='cyan'
                onClick={() => router.push(`/region/${candidate.location}`)}
              >
                {candidate.locationName}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CongressCandidates;