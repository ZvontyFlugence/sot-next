import { IParty } from '@/models/Party';
import { IUser } from '@/models/User';
import { request } from '@/util/ui';
import { Avatar, Badge } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import useSWR from 'swr';

interface IPartyMembers {
  party: IParty,
}

export interface IMemberInfo {
  id: number,
  name: string,
  image: string,
  role: string,
}

export const getPartyMembersFetcher = async (_key: string, token: string, party: IParty) => {
  let members: IMemberInfo[] = [];

  for (let memberId of party.members) {
    const { user: member }: { user: IUser } = await request({
      url: `/api/users/${memberId}`,
      method: 'GET',
      token: token,
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
}

const PartyMembers: React.FC<IPartyMembers> = ({ party }) => {
  const cookies = parseCookies();

  const { data, error } = useSWR(['getPartyMembers', cookies.token, party], getPartyMembersFetcher);

  return (
    <>
      <div className='hidden md:block bg-night shadow-md rounded px-4 py-2'>
        {data && !error && (
          <div className='flex flex-col gap-4'>
            <h3 className='text-xl text-accent font-semibold mb-4'>Members:</h3>
            {data?.members.map((member: IMemberInfo, i: number) => (
              <PartyMember key={i} member={member} />
            ))}
          </div>
        )}
      </div>
      <div className='block md:hidden bg-night shadow-md rounded px-4 py-2'>
        <h3 className='text-xl text-accent font-semibold mb-4'>Members:</h3>
        {data && !error && (
          <div className='flex flex-col gap-4'>
            {data?.members.map((member: IMemberInfo, i: number) => (
              <PartyMember key={i} member={member} />
            ))}
          </div>
        )}
      </div>
    </>
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

export default PartyMembers;