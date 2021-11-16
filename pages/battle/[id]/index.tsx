import BattleLink, { IFighter } from '@/components/battles/BattleLink';
import Layout from '@/components/Layout';
import { useUser } from '@/context/UserContext';
import Battle, { IBattle } from '@/models/Battle';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import User, { IUser } from '@/models/User';
import War, { IWar } from '@/models/War';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar, Button, useToast } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';

interface IBattlePage {
  countries: ICountry[];
  battle: IBattle;
  war: IWar;
  regionName: string;
  users: IUser[];
}

export default function BattlePage({ battle, users, ...props }: IBattlePage) {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const user = useUser();

  const attackBattleHero = getBattleHero('attackers');
  const defendBattleHero = getBattleHero('defenders');

  function getBattleHero(side: 'attackers' | 'defenders'): number {
    if (!battle.stats[side])
      return -1;

    let [_maxDmg, maxDmgId] = Object.entries(battle.stats[side])
      .reduce((accum: [number, number], [fighterId, fighter]: [string, IFighter]) => {
        if (fighter.damage > accum[0])
          return [fighter.damage, Number.parseInt(fighterId)];
        
        return accum;
      }, [0, -1]);

    return maxDmgId;
  }

  const canFight = (): boolean => {
    if (battle.end < new Date(Date.now()))
      return false;

    if (
      props.war.sourceAllies.includes(user.country) ||
      props.war.targetAllies.includes(user.country) ||
      user.location === battle.region
    )
      return true;

    return false;
  }

  const handleFight = () => {
    request({
      url: '/api/wars/fight',
      method: 'POST',
      payload: { battleId: battle._id },
      token: cookies.token,
    }).then(data => {
      if (data?.success)
        refreshData(router);
      else
        showToast(toast, 'error', 'Failed to Fight', data?.error);
    });
  }
  
  return user ? (
    <Layout user={user}>
      <div className='flex flex-col gap-4 bg-night mt-4 mr-8 p-4 rounded shadow-md text-white'>
        <BattleLink
          battle={battle}
          attacker={props.countries[battle.attacker - 1]}
          defender={props.countries[battle.defender - 1]}
          regionName={props.regionName}
          hideBtn
        />
        <div className='flex justify-between items-start px-8'>
          <div className='flex flex-col gap-4'>
            {attackBattleHero !== -1 ? (
              <div className='flex flex-col items-center gap-1 cursor-pointer' onClick={() => router.push(`/profile/${attackBattleHero}`)}>
                <Avatar boxSize='6.0rem' src={users[attackBattleHero - 1]?.image} name={users[attackBattleHero - 1]?.username} />
                <span>{users[attackBattleHero - 1]?.username}</span>
                <span>{battle.stats.attackers[attackBattleHero]?.damage} DMG</span>
              </div>
            ) : (
              <div>No Attacking Battle Hero</div>
            )}
            <div className='flex flex-col gap-2 mt-12'>
              <span className='text-center'>Recent Hits</span>
              {battle.stats.recentHits.attackers.length > 0 ? battle.stats.recentHits.attackers.map(({ userId, damage }, i: number) => (
                <div key={i} className='flex items-center gap-4'>
                  <div className='flex items-center gap-1 cursor-pointer' onClick={() => router.push(`/profile/${userId}`)}>
                    <Avatar src={users[userId - 1].image} name={users[userId - 1].username} />
                    {users[userId - 1].username}
                  </div>
                  <span>{damage} DMG</span>
                </div>
              )) : (
                <span>No Recent Hits</span>
              )}
            </div>
          </div>
          <div className='flex justify-center self-center'>
            <Button size='sm' colorScheme='red' onClick={handleFight} disabled={!canFight()}>Fight</Button>
          </div>
          <div className='flex flex-col gap-4'>
            {defendBattleHero !== -1 ? (
              <div className='flex flex-col items-center gap-1 cursor-pointer' onClick={() => router.push(`/profile/${defendBattleHero}`)}>
                <Avatar boxSize='6.0rem' src={users[defendBattleHero - 1]?.image} name={users[defendBattleHero - 1]?.username} />
                <span>{users[defendBattleHero - 1]?.username}</span>
                <span>{battle.stats.defenders[defendBattleHero]?.damage}</span>
              </div>
            ) : (
              <div>No Defending Battle Hero</div>
            )}
            <div className='flex flex-col gap-2 mt-12'>
              <span className='text-center'>Recent Hits</span>
              {battle.stats.recentHits.defenders.length > 0 ? battle.stats.recentHits.defenders.map(({ userId, damage }, i: number) => (
                <div key={i} className='flex items-center gap-4'>
                  <div className='flex items-center gap-1 cursor-pointer' onClick={() => router.push(`/profile/${userId}`)}>
                    <Avatar src={users[userId - 1].image} name={users[userId - 1].username} />
                    {users[userId - 1].username}
                  </div>
                  <span>{damage}</span>
                </div>
              )) : (
                <span>No Recent Hits</span>
              )}
            </div>          
          </div>
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
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
      battle: jsonify(battle),
      countries: jsonify(countries),
      war: jsonify(war),
      regionName: jsonify(region.name),
      users: jsonify(users),
    },
  };
}