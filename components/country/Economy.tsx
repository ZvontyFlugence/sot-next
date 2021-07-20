import { ICountry } from '@/models/Country';
import { ITEMS } from '@/util/constants';
import { IGameItem, request } from '@/util/ui';
import { useEffect, useState } from 'react';

interface IEconomy {
  country: ICountry;
}

export default function Economy({ country }: IEconomy) {
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
      <div className='flex items-start justify-center gap-24'>
        <div className='flex flex-col align-start gap-2'>
          <p>Minimum Wage: {country.policies.minWage.toFixed(2)} <i className={`flag-icon flag-icon-${country.flag_code}`} /> {country.currency}</p>
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
          <p>Embargoes: {country.policies.embargos.length}</p>
        </div>
      </div>
      <h4 className='text-lg mt-4 mb-2 text-center'>Treasury</h4>
      <div className='flex flex-col justify-center items-center gap-2'>
        {Object.entries(country.treasury).map(([currency, amount]: [string, number], i: number) => (
          <p className='capitalize'>
            {currency.toLowerCase() !== 'gold' ? (
              <span>
                {amount.toFixed(2)} {currency} <i className={`flag-icon flag-icon-${getCountryFlag(currency)}`} title={currency} />
              </span>
            ) : (
              <span>
                {amount.toFixed(2)} {currency} <i className='sot-icon sot-coin' title={currency} />
              </span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}