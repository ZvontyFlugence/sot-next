import { ICandidate, IElection } from '@/models/Election';
import { IParty } from '@/models/Party';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';

interface ICPCandidates {
  user_id: number,
  party: IParty,
}

const CPCandidates: React.FC<ICPCandidates> = ({ user_id, party }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [cp, setCP] = useState<IUser>();
  const [election, setElection] = useState<IElection>();
  const [candidates, setCandidates] = useState<ICandidate[]>([]);

  let date: Date = new Date(Date.now());
  let year: number = date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
  let month: number = date.getUTCDate() <=5 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;
  const canRun: boolean = party.president === user_id || party.cpCandidates.findIndex(can => can.id === user_id) >= 0;

  useEffect(() => {
    request({
      url: `/api/countries/${party.country}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.country.government.president) {
        request({
          url: `/api/users/${data.country.government.president}`,
          method: 'GET',
          token: cookies.token,
        }).then(resp => {
          if (resp.success) {
            setCP(resp.user);
          }
        });
      }
    });

    request({
      url: `/api/elections/country/${party.country}/${year}/${month}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.election) {
        setElection(data.election);
        setCandidates(data.election.candidates);
      }
    });
  }, [party.country, year, month]);

  const submitCandidacy = () => {
    let payload = {
      action: UserActions.RUN_FOR_CP,
      data: {
        partyId: party._id,
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
        showToast(toast, 'error', 'Submit Candidacy Failed', data?.error);
      }
    });
  }

  return (
    <>
      <div className='hidden md:flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
        <h2 className='text-xl text-accent font-semibold'>
          Country President Election: {month}/5/{year}
        </h2>
        <div className='flex justify-between'>
          <div className='flex-grow'>
            <h3 className='text-lg text-accent-alt font-semibold'>Country President:</h3>
            {cp ? (
              <div className='flex items-center gap-4'>
                <Avatar src={cp.image} name={cp.username} />
                <span>{cp.username}</span>
              </div>
            ) : (
              <p>Country Has No President</p>
            )}                  
          </div>
          <div className='flex-grow'>
            <h3 className='text-lg text-accent-alt font-semibold'>Nominee:</h3>
            {candidates.filter(can => can.party === party._id).map((candidate: ICandidate) => (
              <div className='flex items-center gap-4'>
                <Avatar src={candidate.image} name={candidate.name} />
                <span>{candidate.name}</span>
              </div>
            ))}
            {!candidates.some(can => can.party === party._id) && (
              <p>Party Has No Nominee for Country President</p>
            )}                    
          </div>           
        </div>
        <div>
          <h3 className='flex justify-between items-center'>
            <span className='text-lg text-accent-alt font-semibold'>Party Candidates:</span>
            <Button size='sm' colorScheme='blue' onClick={submitCandidacy} disabled={canRun || election?.isActive}>Run</Button>
          </h3>
          {party.cpCandidates.length === 0 && (
            <p>Party Has No Candidates for Country President</p>
          )}
          {party.cpCandidates.map((candidate: ICandidate, i: number) => (
            <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${candidate.id}`)}>
              <Avatar src={candidate.image} name={candidate.name} />
              <span className='font-semibold'>{candidate.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className='flex md:hidden flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
        <div>
          <h3 className='text-xl text-accent font-semibold'>Country President:</h3>
          {cp ? (
            <div className='flex items-center gap-4'>
              <Avatar src={cp.image} name={cp.username} />
              <span>{cp.username}</span>
            </div>
          ) : (
            <p>Country Has No President</p>
          )}                  
        </div>
        <div>
          <h3 className='text-xl text-accent font-semibold'>Nominee:</h3>
          <p>Party Has No Nominee for Country President</p>
        </div>
        <div>
          <h3 className='text-xl text-accent font-semibold'>Party Candidates:</h3>
          {party.cpCandidates.length === 0 && (
            <p>Party Has No Candidates for Country President</p>
          )}
          {party.cpCandidates.map((candidate: ICandidate, i: number) => (
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

export default CPCandidates;