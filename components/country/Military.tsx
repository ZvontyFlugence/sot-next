import { IAlly, ICountry } from '@/models/Country';
import { request } from '@/util/ui';
import { formatDistanceStrict } from 'date-fns';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface IMilitary {
  country: ICountry;
}

export default function Military({ country }: IMilitary) {
  const router = useRouter();

  const [countries, setCountries] = useState<ICountry[]>([]);

  useEffect(() => {
    request({
      url: '/api/countries',
      method: 'GET',
    })
      .then(data => setCountries(data?.countries ?? []));
  }, []);

  return (
    <div className='w-full'>
      <h2 className='text-xl text-accent'>Military</h2>
      <h4 className='text-lg mt-4 mb-2 text-center'>Current Military Policies</h4>
      <div className='flex justify-center items-center gap-24'>
        <div className='flex flex-col items-center gap-2'>
          <p>Allies:</p>
          {country.policies.allies.length > 0 ? country.policies.allies.map((ally: IAlly, i: number) => (
            <div key={i} className='flex justify-between items-center'>
              <p className='flex items-center gap-2 cursor-pointer'>
                <i className={`flag-icon flag-icon-${countries[ally.country - 1]?.flag_code} rounded shadow-md`} />
                {countries[ally.country - 1]?.name}
              </p>
              <span className='ml-8 text-gray-300 text-sm'>
                {formatDistanceStrict(new Date(ally?.expires), new Date(Date.now()))}
              </span>
            </div>
          )) : (
            <p>Country Has No Allies</p>
          )}
        </div>
        <div className='flex flex-col items-center gap-2'>
          <p>Active Wars:</p>
          <p>Country Has No Active Wars</p>
        </div>
      </div>
    </div>
  );
}