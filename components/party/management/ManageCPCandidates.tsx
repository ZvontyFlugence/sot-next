import { ICandidate, IElection } from '@/models/Election';
import { IUser } from '@/models/User';
import { PartyActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect } from 'react';
import { useState } from 'react';

interface IManageCPCandidates {
  partyId: number,
  country: number,
  candidates: ICandidate[];
}

const ManageCPCandidates: React.FC<IManageCPCandidates> = ({ partyId, candidates, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [cp, setCP] = useState<IUser>();
  const [election, setElection] = useState<IElection>();

  let date: Date = new Date(Date.now());
  let year: number = date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
  let month: number = date.getUTCDate() <=5 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;

  useEffect(() => {
    request({
      url: `/api/countries/${props.country}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.country.government.president) {
        request({
          url: `/api/users/${data.country.government.president}`,
          method: 'GET',
          token: cookies.token,
        }).then(resp => setCP(resp.user));
      }
    });

    request({
      url: `/api/elections/country/${props.country}/${year}/${month}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.election) {
        setElection(data.election);
      }
    });
  }, []);

  const selectNominee = (memberId: number) => {
    let payload = {
      action: PartyActions.NOMINATE_CP,
      data: { candidateId: memberId },
    };

    request({
      url: `/api/parties/${partyId}/doAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Nominate Candidate Failed', data?.error);
      }
    });
  }

  return (
    <>
      <div className='hidden md:flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
        <h2 className='text-xl text-accent font-semibold'>
          Country President Elections: {month}/5/{year}
        </h2>
        <div className='flex justify-between'>
          <div className='flex-grow'>
            <h3 className='text-lg text-accent-alt font-semibold'>Current President:</h3>
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
            <h3 className='text-lg text-accent-alt font-semibold'>Party Nominee:</h3>
            {election && election.candidates.filter(can => can.party === partyId).map((candidate: ICandidate) => (
              <div className='flex items-center gap-4'>
                <Avatar src={candidate.image} name={candidate.name} />
                <span>{candidate.name}</span>
              </div>
            ))}
            {!election || !election.candidates.some(can => can.party === partyId) && (
              <p>Party Has No Nominee for Country President</p>
            )}
          </div>                
        </div>
        <div>
          <h3 className='text-lg text-accent-alt font-semibold'>Party Candidates:</h3>
          {candidates.length === 0 && (
            <p>Party Has No Candidates for Country President</p>
          )}
          {candidates.map((candidate: ICandidate, i: number) => (
            <div key={i} className='flex justify-between items-center'>
              <div className='flex items-center gap-4'>
                <Avatar src={candidate.image} name={candidate.name} />
                <span className='font-semibold'>{candidate.name}</span>
              </div>
              <Button
                size='sm'
                colorScheme='green'
                onClick={() => selectNominee(candidate.id)}
                disabled={election && election.candidates.findIndex(can => can.id === candidate.id) >= 0}
              >
                Nominate
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className='flex md:hidden flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>

      </div>
    </>
  );
}

export default ManageCPCandidates;