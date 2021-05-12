import { IUser } from '@/models/User';
import { IActivityInfo } from '@/pages/profile/[id]';
// import { request } from '@/util/ui';
import { Avatar } from '@chakra-ui/avatar';
import { StackDivider, VStack } from '@chakra-ui/layout';
import { useRouter } from 'next/router';
// import { parseCookies } from 'nookies';
// import { useQuery } from 'react-query';

interface IProfileActivities {
  profile: IUser,
  jobInfo: IActivityInfo,
}

const ProfileActivities: React.FC<IProfileActivities> = ({ profile, jobInfo }) => {
  // const cookies = parseCookies();
  const router = useRouter();

  return (
    <div className='bg-night text-white p-4 shadow-md rounded'>
      <VStack className='flex flex-col items-center gap-2' divider={<StackDivider borderColor="accent-alt" />}>
        <div className='flex flex-col justify-center items-center gap-0.5 cursor-pointer' onClick={() => router.push(`/company/${profile.job}`)}>
          <p className='h-brand text-accent'>Job</p>
          <Avatar src={jobInfo.image} name={jobInfo.name} />
          <p>{jobInfo.name}</p>
          <p>{jobInfo.title}</p>
        </div>
        <div className='flex flex-col justify-center items-center gap-0.5 cursor-pointer'>
          <p className='h-brand text-accent'>Political Party</p>
          <p>None</p>
        </div>
        <div className='flex flex-col justify-center items-center gap-0.5 cursor-pointer'>
          <p className='h-brand text-accent'>Military Unit</p>
          <p>None</p>
        </div>
        <div className='flex flex-col justify-center items-center gap-0.5 cursor-pointer'>
          <p className='h-brand text-accent'>Newspaper</p>
          <p>None</p>
        </div>
      </VStack>
    </div>
  );
}

export default ProfileActivities;