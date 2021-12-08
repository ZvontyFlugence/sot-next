import { ICountry, IEmbargo } from '@/models/Country';
import { ITEMS } from '@/util/constants';
import { IGameItem, request } from '@/util/ui';
import { formatDistanceStrict } from 'date-fns';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface IEconomy {
  country: ICountry;
}

export default function Economy({ country }: IEconomy) {
  const router = useRouter();
  
  const [countries, setCountries] = useState<ICountry[]>([]);

  useEffect(() => {
    request({
      url: '/api/countries',
      method: 'GET',
    }).then(data => {
      if (data?.countries)
        setCountries(data.countries);
    });
  }, []);

  const getUniqueItems = (): IGameItem[] => {
    return ITEMS.reduce((accum: IGameItem[], item: IGameItem) => {
      let exists: boolean = accum.findIndex((p: IGameItem) => p?.name === item.name) !== -1;

      if (!exists)
        accum.push(item);

      return accum;
    }, []);
  }

  const getCountryFlag = (currency: string) => {
    if (currency === country.currency)
      return country.flag_code;

    let index: number = countries.findIndex(c => c.currency === currency);
    if (index > -1)
      return countries[index].flag_code;

    return '';
  }

  return (
    <div className='w-full'>
      <h2 className='text-xl text-accent'>Economy</h2>
      <h4 className='text-lg mt-4 mb-2 text-center'>Current Economic Policies</h4>
      <div className='flex md:flex-row flex-col items-start justify-center md:gap-24 gap-8'>
        <div className='flex flex-col align-start gap-2'>
          <p>Minimum Wage: {country.policies.minWage.toFixed(2)} <i className={`sot-flag sot-flag-${country.flag_code}`} /> {country.currency}</p>
          <p>Income Tax: {country.policies.taxes.income}%</p>
        </div>
        <div className='flex flex-col align-start gap-2'>
          <div>
            Import Tax:
            {getUniqueItems().map((item: IGameItem, i: number) => (
              <p key={i} className='flex justify-start items-center'>
                <span className='flex items-center gap-2'>
                  <i className={`sot-icon ${item?.image}`} title={item?.name} />
                  {item?.name}
                </span>
                <span className='ml-2'>{(country.policies.taxes?.import && country.policies.taxes.import[item?.id]) || 0}%</span>
              </p>
            ))}
          </div>
        </div>
        <div className='flex flex-col align-start gap-2'>
          <div>
              Value-Added Tax:
              {getUniqueItems().map((item: IGameItem, i: number) => (
                <p key={i} className='flex items-center'>
                  <span className='flex items-center gap-2'>
                    <i className={`sot-icon ${item?.image}`} title={item?.name} />
                    {item?.name}
                  </span>
                  <span className='ml-2'>{(country.policies.taxes?.vat && country.policies.taxes.vat[item?.id]) || 0}%</span>
                </p>
              ))}
            </div>
        </div>
        <div className='flex flex-col align-start gap-2'>
          <p>Embargoes:</p>
          <div>
            {country.policies.embargos.map((embargo: IEmbargo, i: number) => (
              <div key={i} className='flex justify-between items-center'>
                <p className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/country/${embargo.country}`)}>
                  <i className={`sot-flag sot-flag-${countries[embargo.country - 1]?.flag_code}`} />
                  {countries[embargo.country - 1]?.name}
                </p>
                <span className='ml-8 text-gray-300 text-sm'>{formatDistanceStrict(new Date(embargo?.expires), new Date(Date.now()))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h4 className='text-lg mt-4 mb-2 text-center'>Treasury</h4>
      <div className='flex flex-col justify-center items-center gap-2'>
        {Object.entries(country.treasury).map(([currency, amount]: [string, number], i: number) => (
          <p className='capitalize'>
            {currency.toLowerCase() !== 'gold' ? (
              <span>
                {amount.toFixed(2)} {currency} <i className={`sot-flag sot-flag-${getCountryFlag(currency)}`} title={currency} />
              </span>
            ) : (
              <span>
                {amount.toFixed(2)} {currency} <i className='sot-icon sot-coin' title={currency} />
              </span>
            )}
          </p>
        ))}
      </div>
      {/* TODO: Show Graphs of Economic trends over a given period or a fixed period of the past month */}
      <div className='flex items-center gap-8'>
        
      </div>
    </div>
  );
}