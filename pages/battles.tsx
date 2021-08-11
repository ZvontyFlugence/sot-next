import BattleLink from "@/components/battles/BattleLink";
import Layout from "@/components/Layout";
import Select from "@/components/Select";
import Battle, { IBattle } from "@/models/Battle";
import Country, { ICountry } from "@/models/Country";
import Region, { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";
import War, { IWar } from "@/models/War";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { IRegionSet, refreshData, request } from "@/util/ui";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from "nookies";
import { useState } from "react";
import { useEffect } from "react";

interface IBattles {
  user: IUser;
  isAuthenticated: boolean;
  countries: ICountry[];
  battles: IBattle[];
  wars: IWar[];
  regionSet: IRegionSet;
}

export default function Battles({ user, countries, battles, ...props }: IBattles) {
  const router = useRouter();

  const [filteredBattles, setFilteredBattles] = useState<IBattle[]>([]);

  useEffect(() => {
    setFilteredBattles(() => {
      return battles.filter((battle) => {
        const { country } = router.query;
        let war: IWar = props.wars.find(w => w._id === battle.war);
        if (!country)
          return true;

        let countryId = Number.parseInt(country as string);
        if (countryId === battle.attacker || countryId === battle.defender)
          return true;
        else if (war && war?.sourceAllies.includes(countryId))
          return true;
        else if (war && war?.targetAllies.includes(countryId))
          return true;

        return false;
      });
    })
  }, [router.query]);

  return user ? (
    <Layout user={user}>
      <div className='flex justify-between items-center mr-20'>
        <h1 className='text-2xl text-accent'>Battles</h1>
        <Select onChange={(val) => router.push(val !== -1 ? `/battles?country=${val as string}` : '/battles')}>
          <Select.Option value={-1}><span>Global</span></Select.Option>
          {countries.map((country: ICountry, i: number) => (
            <Select.Option key={i} value={country._id}>
              <div className='flex items-center gap-2'>
                <i className={`flag-icon flag-icon-${country.flag_code}`} />
                {country.name}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className='flex flex-col gap-4 bg-night mt-4 mr-8 p-4 rounded shadow-md text-white'>
        {filteredBattles.length > 0 ? filteredBattles.filter(b => new Date(b.end) > new Date()).slice(0).reverse().map((battle: IBattle, i: number) => (
          <BattleLink
            key={i}
            battle={battle}
            attacker={countries[battle.attacker - 1]}
            defender={countries[battle.defender - 1]}
            regionName={props.regionSet[battle.region]}
          />
        )) : (
          <p>This Country Isn't Involved In Any Battles</p>
        )}
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async (ctx) => {
  const { req, res, params } = ctx;

  let result = await getCurrentUser(req);
  if (!result.isAuthenticated) {
    destroyCookie({ res }, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let countries: ICountry[] = await Country.find({}).exec();
  let battles: IBattle[] = await Battle.find({}).exec();
  let wars: IWar[] = await War.find({}).exec();

  let regionSet: IRegionSet = {};

  for (let battle of battles) {
    if (!regionSet[battle.region]) {
      let region: IRegion = await Region.findOne({ _id: battle.region }).exec();
      regionSet[battle.region] = region.name;
    }
  }

  return {
    props: {
      ...result,
      countries: jsonify(countries),
      battles: jsonify(battles),
      wars: jsonify(wars),
      regionSet: jsonify(regionSet),
    }
  }
}