import { ICountry } from '@/models/Country';
import { IUser } from '@/models/User';
import { request } from '@/util/ui';
import { Avatar, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';

interface IGovernmentTab {
  country: ICountry;
}

interface ICabinetInfo {
  mofa?: IUser,
  mod?: IUser,
  mot?: IUser,
}

export interface ICongressUser extends IUser {
  residenceName?: string;
}

const Government: React.FC<IGovernmentTab> = ({ country }) => {
  const cookies = parseCookies();
  const router = useRouter();

  const [cp, setCP] = useState<IUser>();
  const [vp, setVP] = useState<IUser>();
  const [cabinet, setCabinet] = useState<ICabinetInfo>({});
  const [congress, setCongress] = useState<ICongressUser[]>([]);

  useEffect(() => {
    if (country.government.president) {
      request({
        url: `/api/users/${country.government.president}`,
        method: 'GET',
        token: cookies.token,
      }).then(data => {
        if (data.success)
          setCP(data.user);
      });
    }

    if (country.government.vp) {
      request({
        url: `/api/users/${country.government.vp}`,
        method: 'GET',
        token: cookies.token,
      }).then(data => {
        if (data.success)
          setVP(data.user);
      });
    }

    if (country.government.cabinet.mofa) {
      request({
        url: `/api/users/${country.government.cabinet.mofa}`,
        method: 'GET',
        token: cookies.token,
      }).then(data => {
        if (data.success)
          setCabinet(prev => ({ ...prev, mofa: data.user }));
      });
    }

    if (country.government.cabinet.mod) {
      request({
        url: `/api/users/${country.government.cabinet.mod}`,
        method: 'GET',
        token: cookies.token,
      }).then(data => {
        if (data.success)
          setCabinet(prev => ({ ...prev, mod: data.user }));
      });
    }

    if (country.government.cabinet.mot) {
      request({
        url: `/api/users/${country.government.cabinet.mot}`,
        method: 'GET',
        token: cookies.token,
      }).then(data => {
        if (data.success)
          setCabinet(prev => ({ ...prev, mot: data.user }));
      });
    }

    if (country.government.congress.length > 0) {
      request({
        url: `/api/countries/${country._id}/congress`,
        method: 'GET',
        token: cookies.token,
      }).then(data => {
        if (data.success)
          setCongress(data.congress);
      });
    }
  }, [country]);

  const getCabinetPosition = (key: string) => {
    switch (key) {
      case 'mofa':
        return 'Minister of Foreign Affairs';
      case 'mod':
        return 'Minister of Defense';
      case 'mot':
        return 'Minister of Treasury';
      default:
        return '';
    }
  }

  const goToCPElection = () => {
    let date: Date = new Date(Date.now());
    let month: number = 0;
    let year: number = 0;

    if (date.getUTCDate() > 5) {
      // Use Previous Month
      month = date.getUTCMonth();
      year = date.getUTCMonth() === 0 ? date.getUTCFullYear() - 1 : date.getUTCFullYear();
    } else {
      // Use Current Month
      month = date.getUTCMonth() + 1;
      year = date.getUTCFullYear();      
    }

    router.push(`/election/country/${country._id}/${year}/${month}/results`);
  }

  return (
    <div className='w-full'>
      <h2 className='text-xl text-accent'>Government</h2>
      <h4 className='text-lg mt-4'>Government Info</h4>
      <div className='flex flex-col gap-2'>
        <p className='capitalize'>Government Type: {country.policies.governmentType}</p>
      </div>
      <h4 className='text-lg mt-4'>Executive</h4>
      <div className='flex flex-col gap-2'>
        {cp && (
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-2 max-w-min cursor-pointer' onClick={() => router.push(`/profile/${cp._id}`)}>
              <span>President:</span>
              <Avatar src={cp.image} name={cp.username} />
              <span>{cp.username}</span>
            </div>
            <Button
              size='sm'
              colorScheme='blue'
              onClick={goToCPElection}
            >
              View Election
            </Button>
          </div>
        )}

        {vp && (
          <div className='flex items-center gap-2 max-w-min cursor-pointer' onClick={() => router.push(`/profile/${vp._id}`)}>
            <span>President:</span>
            <Avatar src={vp.image} name={vp.username} />
            <span>{vp.username}</span>
          </div>
        )}

        {Object.keys(cabinet).map((key: string, i: number) => (
          <div key={i} className='flex items-center gap-2 max-w-min cursor-pointer' onClick={() => router.push(`/profile/${cabinet[key]?._id}`)}>
            <span>{getCabinetPosition(key)}:</span>
            <Avatar src={cabinet[key]?.image} name={cabinet[key]?.username} />
            <span>{cabinet[key]?.username}</span>
          </div>
        ))}
      </div>
      <h4 className='text-lg mt-4'>Legislature</h4>
      <div className='flex flex-col gap-2'>
        {congress.map((member: ICongressUser, i: number) => (
          <div key={i} className='flex items-center gap-2 max-w-min'>
            <div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/profile/${member._id}`)}>
              <Avatar src={member.image} name={member.username} />
              <span>{member.username}</span>
            </div>
            <span className='cursor-pointer' onClick={() => router.push(`/region/${member.residence}`)}>{member.residenceName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Government;