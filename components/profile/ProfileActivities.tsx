import { IUser } from '@/models/User';
import { IActivityInfo } from '@/pages/profile/[id]';
import { Avatar } from '@chakra-ui/avatar';
import { StackDivider, VStack } from '@chakra-ui/layout';
import { useRouter } from 'next/router';

interface IProfileActivities {
  profile: IUser,
  jobInfo: IActivityInfo,
  partyInfo: IActivityInfo,
  armyInfo: IActivityInfo,
  newsInfo: IActivityInfo,
}

const ProfileActivities: React.FC<IProfileActivities> = ({ profile, jobInfo, partyInfo, armyInfo, newsInfo }) => {
  const router = useRouter();

  return (
    <div className='bg-night text-white p-4 shadow-md rounded'>
      <VStack className='flex flex-col items-center gap-2' divider={<StackDivider borderColor="whiteAlpha.400" />}>
        <div className='flex flex-col items-center gap-0.5 cursor-pointer' onClick={() => router.push(`/company/${profile.job}`)}>
          <p className='h-brand text-accent text-xl'>Job</p>
          {jobInfo ? (
            <div className='flex gap-4'>
              <Avatar src={jobInfo.image} name={jobInfo.name} />
              <div>
                <p className='font-semibold'>{jobInfo.name}</p>
                <p className='text-center'>{jobInfo.title}</p>
              </div>
            </div>
          ) : (
            <p>None</p>
          )}
        </div>
        <div className='flex flex-col items-center gap-0.5 cursor-pointer' onClick={() => router.push(`/party/${profile.party}`)}>
          <p className='h-brand text-accent text-xl'>Political Party</p>
          {partyInfo ? (
            <div className='flex gap-4'>
              <Avatar src={partyInfo.image} name={partyInfo.name} />
              <div>
                <p className='font-semibold'>{partyInfo.name}</p>
                <p className='text-center'>{partyInfo.title}</p>
              </div>
            </div>
          ) : (
            <p>None</p>
          )}
        </div>
        <div className='flex flex-col items-center gap-0.5 cursor-pointer' onClick={() => router.push(`/army/${profile.unit}`)}>
          <p className='h-brand text-accent text-xl'>Military Unit</p>
          {armyInfo ? (
            <div className='flex gap-4'>
              <Avatar src={armyInfo.image} name={armyInfo.name} />
              <div>
                <p className='font-semibold'>{armyInfo.name}</p>
                <p className='text-center'>{armyInfo.title}</p>
              </div>
            </div>
          ) : (
            <p>None</p>
          )}
        </div>
        <div className='flex flex-col items-center gap-0.5 cursor-pointer' onClick={() => router.push(`/newspaper/${profile.newspaper}`)}>
          <p className='h-brand text-accent text-xl'>Newspaper</p>
          {newsInfo ? (
            <div className='flex gap-4'>
              <Avatar src={newsInfo.image} name={newsInfo.name} />
              <div>
                <p className='font-semibold'>{newsInfo.name}</p>
                <p className='text-center'>{newsInfo.title}</p>
              </div>
            </div>
          ) : (
            <p>None</p>
          )}
        </div>
      </VStack>
    </div>
  );
}

export default ProfileActivities;