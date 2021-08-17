import BattleLink from '@/components/battles/BattleLink';
import Layout from '@/components/Layout';
import Battle, { IBattle } from '@/models/Battle';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import { IUser } from '@/models/User';
import War, { IWar } from '@/models/War';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { IRegionSet } from '@/util/ui';
import { useRouter } from 'next/router';
import { destroyCookie } from 'nookies';

interface IWarPage {
  user: IUser;
  isAuthenticated: boolean;
  war: IWar;
  battles: IBattle[];
  countries: ICountry[];
  regionSet: IRegionSet;
}

// TODO: Potentially use setInterval to poll remaining time in battle w/o page refresh?
export default function WarPage({ user, war, battles, countries, ...props }: IWarPage) {
  const router = useRouter();

  const source: ICountry = countries[war.source - 1];
  const target: ICountry = countries[war.target - 1];

  return user ? (
    <Layout user={user}>
      <h1 className='flex items-center gap-2 text-accent text-2xl'>
        <i className={`flag-icon flag-icon-${source?.flag_code}`} />
        {source.name}
        <span>-</span>
        <i className={`flag-icon flag-icon-${target?.flag_code}`} />
        {target.name}
        <span>War</span>
      </h1>
      <div className='flex flex-col md:flex-row md:gap-36 bg-night mt-4 mr-8 p-4 rounded shadow-md'>
        <div className='flex items-start gap-8 text-white'>
          <div>
            <h3 className='text-2xl text-center'>Attackers</h3>
            {war.sourceAllies.map((cid: number) => (
              <p key={cid} className='flex items-center gap-2 text-xl cursor-pointer' onClick={() => router.push(`/country/${cid}`)}>
                <i className={`flag-icon flag-icon-${countries[cid - 1]?.flag_code}`} />
                <span className={cid === war.source && 'text-accent-alt'}>{countries[cid - 1]?.name}</span>
              </p>
            ))}
          </div>
          <div>
            <h3 className='text-2xl text-center'>Defenders</h3>
            {war.targetAllies.map((cid: number) => (
              <p key={cid} className='flex items-center gap-2 text-xl cursor-pointer' onClick={() => router.push(`/country/${cid}`)}>
                <i className={`flag-icon flag-icon-${countries[cid - 1]?.flag_code}`} />
                <span className={cid === war.target && 'text-accent-alt'}>{countries[cid - 1]?.name}</span>
              </p>
            ))}
          </div>
        </div>
        <div className='flex flex-col gap-2 text-white'>
          <h3 className='text-2xl'>Battles</h3>
          {battles.slice(0).reverse().map((battle: IBattle, i: number) => (
            <BattleLink
              key={i}
              battle={battle}
              attacker={countries[battle.attacker - 1]}
              defender={countries[battle.defender - 1]}
              regionName={props.regionSet[battle.region]}
            />
          ))}
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async (ctx) => {
  let { req, res, params } = ctx;
  
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

  let warId: string;
  
  try {
    warId = params?.id as string;
  } catch (e) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  let countries: ICountry[] = await Country.find({}).exec();
  let war: IWar = await War.findOne({ _id: warId }).exec();
  let battles: IBattle[] = await Battle.find({ war: warId }).exec();

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
      war: jsonify(war),
      battles: jsonify(battles),
      regionSet: jsonify(regionSet),
    },
  };
}