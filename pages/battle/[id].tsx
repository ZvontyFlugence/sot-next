import BattleLink from '@/components/battles/BattleLink';
import Layout from '@/components/Layout';
import Battle, { IBattle } from '@/models/Battle';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import User, { IUser } from '@/models/User';
import War, { IWar } from '@/models/War';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { Avatar, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie } from 'nookies';

interface IBattlePage {
  user: IUser;
  isAuthenticated: boolean;
  countries: ICountry[];
  battle: IBattle;
  war: IWar;
  regionName: string;
  users: IUser[];
}

export default function BattlePage({ user, battle, users, ...props }: IBattlePage) {
  const router = useRouter();
  
  return user ? (
    <Layout user={user}>
      <div className='flex flex-col gap-4 bg-night mt-4 mr-8 p-4 rounded shadow-md text-white'>
        <BattleLink
          battle={battle}
          attacker={props.countries[battle.attacker - 1]}
          defender={props.countries[battle.defender - 1]}
          regionName={props.regionName}
        />
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-4'>
            {battle.stats?.battleHeroes?.attacker !== -1 && (
              <div className='flex flex-col gap-1 cursor-pointer' onClick={() => router.push(`/profile/${battle.stats.battleHeroes?.attacker}`)}>
                <Avatar src={users[battle.stats.battleHeroes?.attacker - 1]?.image} name={users[battle.stats.battleHeroes?.attacker - 1]?.username} />
                {users[battle.stats.battleHeroes?.attacker - 1]?.username}
                {battle.stats.attackers[battle.stats.battleHeroes?.attacker].damage}
              </div>
            )}
            {battle.stats?.recentHits?.attackers.map(({ userId, damage }, i: number) => (
              <div key={i} className='flex items-center gap-2'>
                <div className='flex flex-col gap-1 cursor-pointer' onClick={() => router.push(`/profile/${userId}`)}>
                  <Avatar src={users[userId - 1].image} name={users[userId - 1].username} />
                  {users[userId - 1].username}
                </div>
                <span>{damage}</span>
              </div>
            ))}
          </div>
          <div className='flex justify-center'>
            <Button size='sm' colorScheme='red' onClick={() => null}>Fight</Button>
          </div>
          <div className='flex flex-col gap-4'>
            {battle.stats?.battleHeroes?.defender !== -1 && (
              <div className='flex flex-col gap-1 cursor-pointer' onClick={() => router.push(`/profile/${battle.stats.battleHeroes?.defender}`)}>
                <Avatar src={users[battle.stats.battleHeroes?.defender - 1]?.image} name={users[battle.stats.battleHeroes?.defender - 1]?.username} />
                {users[battle.stats.battleHeroes?.defender - 1]?.username}
                {battle.stats.defenders[battle.stats.battleHeroes?.defender].damage}
              </div>
            )}
            {battle.stats?.recentHits?.defenders.map(({ userId, damage }, i: number) => (
              <div key={i} className='flex items-center gap-2'>
                <div className='flex flex-col gap-1 cursor-pointer' onClick={() => router.push(`/profile/${userId}`)}>
                  <Avatar src={users[userId - 1].image} name={users[userId - 1].username} />
                  {users[userId - 1].username}
                </div>
                <span>{damage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async (ctx) => {
  const { req, res, params } = ctx;

  const result = await getCurrentUser(req);
  if (!result.isAuthenticated) {
    destroyCookie({ res }, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let battleId: string;
  try {
    battleId = params?.id as string;
  } catch (e) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  let battle: IBattle = await Battle.findOne({ _id: battleId }).exec();
  let countries: ICountry[] = await Country.find({}).exec();
  let war: IWar = await War.findOne({ _id: battle.war }).exec();
  let region: IRegion = await Region.findOne({ _id: battle.region }).exec();
  let users: IUser[] = await User.find({}).exec();

  return {
    props: {
      ...result,
      battle: jsonify(battle),
      countries: jsonify(countries),
      war: jsonify(war),
      regionName: jsonify(region.name),
      users: jsonify(users),
    },
  };
}