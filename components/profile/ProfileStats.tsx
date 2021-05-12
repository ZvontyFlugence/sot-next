import { IUser } from '@/models/User';
import { Stat, StatLabel, StatNumber } from '@chakra-ui/stat';

interface IProfileStats {
  profile: IUser,
}

const ProfileStats: React.FC<IProfileStats> = ({ profile }) => {
  return (
    <div className=''>
      <Stat>
        <StatLabel>Strength</StatLabel>
        <StatNumber className='flex items-center gap-2'>
          {profile.strength}
          <i className='sot-str w-6' />
        </StatNumber>
      </Stat>
    </div>
  );
}

export default ProfileStats;

