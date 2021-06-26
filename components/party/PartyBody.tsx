import { ICandidate } from "@/models/Election";
import { IParty } from "@/models/Party";
import { IUser } from "@/models/User";
import user from "@/pages/api/stats/user";
import { UserActions } from "@/util/actions";
import { refreshData, request, showToast } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Badge } from "@chakra-ui/layout";
import { Button, useToast } from "@chakra-ui/react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";

interface IPartyBodyProps {
  party: IParty,
  user_id: number,
}

export interface IMemberInfo {
  id: number,
  name: string,
  image: string,
  role: string,
}

const PartyBody: React.FC<IPartyBodyProps> = ({ party, user_id }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [cp, setCP] = useState<IUser>();
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
        setCandidates(data.election.candidates);
      }
    });
  }, [party.country, year, month]);

  const { isLoading, data, error } = useQuery('getPartyMembers', async () => {
    let members: IMemberInfo[] = [];

    for (let memberId of party.members) {
      const { user: member }: { user: IUser } = await request({
        url: `/api/users/${memberId}`,
        method: 'GET',
        token: cookies.token,
      });

      let role: string = 'Member';

      if (party.president === member._id)
        role = 'Party President';
      else if (party.vp === member._id)
        role = 'Vice Party President';

      members.push({
        id: member._id,
        name: member.username,
        image: member.image,
        role,
      } as IMemberInfo);
    }

    return { members };
  });

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
    <div className='w-full'>
      <div className='hidden md:block'>
        <Tabs className='flex items-start gap-4' orientation='vertical'>
          <TabList className='bg-night rounded shadow-md text-white'>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Members</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Party Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Congress Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Country Elections</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
            {!isLoading && !error && (
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>
                <h3 className='text-xl text-accent font-semibold mb-4'>Members:</h3>
                {data?.members.map((member: IMemberInfo, i: number) => (
                  <PartyMember key={i} member={member} />
                ))}
              </div>
            )}
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

              </div>
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

              </div>
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
                <h2 className='text-xl text-accent font-semibold'>
                  Country President Election: {month}/{year}
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
                    <Button size='sm' colorScheme='blue' onClick={submitCandidacy} disabled={canRun}>Run</Button>
                  </h3>
                  {party.cpCandidates.length === 0 && (
                    <p>Party Has No Candidates for Country President</p>
                  )}
                  {party.cpCandidates.map((candidate: ICandidate, i: number) => (
                    <div key={i} className='flex items-center gap-4'>
                      <Avatar src={candidate.image} name={candidate.name} />
                      <span className='font-semibold'>{candidate.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
      <div className='block md:hidden'>
        <Tabs className='flex flex-col gap-2' orientation='horizontal'>
          <TabList className='bg-night rounded shadow-md text-sm text-white overflow-x-auto overflow-y-hidden'>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Members</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Party Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Congress Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Country Elections</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <h3 className='text-xl text-accent font-semibold mb-4'>Members:</h3>
              {!isLoading && !error && (
                <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>
                  {data?.members.map((member: IMemberInfo, i: number) => (
                    <PartyMember key={i} member={member} />
                  ))}
                </div>
              )}
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

              </div>
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

              </div>
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2 text-white'>
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
                    <div key={i} className='flex items-center gap-4'>
                      <Avatar src={candidate.image} name={candidate.name} />
                      <span className='font-semibold'>{candidate.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}

interface IPartyMemberProps {
  member: IMemberInfo,
}

const PartyMember: React.FC<IPartyMemberProps> = ({ member }) => {
  const router = useRouter();

  return (
    <div className='flex justify-between items-center'>
      <div className='flex items-center flex-grow cursor-pointer' onClick={() => router.push(`/profile/${member.id}`)}>
        <Avatar boxSize='3.0rem' src={member.image} name={member.name} borderRadius='full' />
        <span className='ml-2 text-white font-semibold'>{member.name}</span>
      </div>
      <Badge colorScheme={getRoleColor(member.role)}>{member.role}</Badge>
    </div>
  );
}

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'Party President':
      return 'purple';
    case 'Vice Party President':
      return 'teal';
    default:
      return 'gray';
  }
}

export default PartyBody;