import Select from '@/components/Select';
import { ICountry } from '@/models/Country';
import { request } from '@/util/ui';
import {
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface IAllianceLawForm {
  setCountry: (countryId: number) => void,
}

// TODO: Filter out countries that are already allies
export default function AllianceLawForm({ setCountry }: IAllianceLawForm) {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    request({
      url: '/api/countries',
      method: 'GET',
    }).then(data => {
      if (data.countries)
        setCountries(data.countries);
    });
  }, []);

  const updateCountry = (value: string | number) => {
    setSelected(value as number);
    setCountry(value as number);
  }

  return (
    <div className='mt-2'>
      <FormControl>
        <FormLabel>Country:</FormLabel>
        <Select className='border border-white border-opacity-25 rounded shadow-md' selected={selected} onChange={updateCountry}>
          <Select.Option disabled value={0}>Select Country</Select.Option>
          {countries.map((c: ICountry, i: number) => (
            <Select.Option value={c._id}>
              <span className='flex items-center gap-2'>
                {c.name}
                <i className={`flag-icon flag-icon-${c.flag_code}`} title={c.name} />
              </span>
            </Select.Option>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};