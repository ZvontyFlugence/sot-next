import { ICountry } from "@/models/Country";
import { useRouter } from "next/router";
import Select from "../Select";

interface ICountryHead {
  country: ICountry,
  countries: ICountry[],
}

const CountryHead: React.FC<ICountryHead> = ({ country, countries }) => {
  const router = useRouter();

  const goToCountry = (id: number) => {
    router.push(`/country/${id}`);
  }

  return (
    <div className='bg-night text-white p-4 shadow-md rounded'>
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className='flex items-center gap-2 text-2xl'>
          { country.name }
          <span className='sot-flag-wrap'>
            <i className={`sot-flag sot-flag-${country.flag_code} h-10`} />
          </span>
        </h1>
        <Select className='border border-white border-opacity-25 rounded' selected={country._id} onChange={val => goToCountry(val as number)}>
          {countries.map((c, i) => (
            <Select.Option key={i} value={c._id}>
              <span className='sot-flag-wrap'>
                <i className={`sot-flag sot-flag-${c.flag_code} h-8`} />
              </span>
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default CountryHead;