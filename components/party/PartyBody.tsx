import { IParty } from "@/models/Party";
import { IUser } from "@/models/User";
import { request } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Badge } from "@chakra-ui/layout";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useQuery } from "react-query";

interface IPartyBodyProps {
  party: IParty,
}

export interface IMemberInfo {
  id: number,
  name: string,
  image: string,
  role: string,
}

const PartyBody: React.FC<IPartyBodyProps> = ({ party }) => {
  const cookies = parseCookies();

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

  return (
    <div className='w-full'>
      <div className='hidden md:block'>
        <Tabs className='flex gap-4' orientation='vertical'>
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
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

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
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

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