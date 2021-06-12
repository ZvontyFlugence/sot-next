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
        <h1 className='text-2xl'>
          { country.name }
          <i className={`ml-2 flag-icon flag-icon-${country.flag_code}`} />
        </h1>
        <Select className='border border-white border-opacity-25 rounded' onChange={val => goToCountry(val as number)}>
          {countries.map((c, i) => (
            <Select.Option key={i} value={c._id}>
              <i className={`flag-icon flag-icon-${c.flag_code}`} />
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default CountryHead;