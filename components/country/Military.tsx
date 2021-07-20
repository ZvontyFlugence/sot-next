import { ICountry } from '@/models/Country';

interface IMilitary {
  country: ICountry;
}

export default function Military({ country }: IMilitary) {
  return (
    <div className='w-full'>
      <h2 className='text-xl text-accent'>Military</h2>
    </div>
  );
}