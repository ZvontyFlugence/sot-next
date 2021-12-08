import { IBattle } from '@/models/Battle';
import { ICountry } from '@/models/Country';
import { Button, propNames } from '@chakra-ui/react';
import { formatDistanceStrict } from 'date-fns';
import { useRouter } from 'next/router';

interface IBattleLink {
  battle: IBattle;
  attacker: ICountry;
  defender: ICountry;
  regionName: string;
  hideBtn?: boolean;
}

interface IFighterSet {
  [userId: number]: IFighter;
}

export interface IFighter {
  country: number;
  damage: number;
}

export default function BattleLink({ battle, attacker, defender, regionName, ...props }: IBattleLink) {
  const router = useRouter();

  let now: Date = new Date(Date.now());
  const isDone: boolean = isBattleOver();
  const attackDmg: number = getSideDamage('attack');
  const defenseDmg: number = getSideDamage('defend');

  function isBattleOver(): boolean {
    return new Date(battle.end) < now;
  }

  function getSideDamage(side: 'attack' | 'defend') {
    let fighterSet: IFighterSet = {};
    let sideDamage: number = 0;
    switch (side) {
      case 'attack': {
        fighterSet = battle.stats.attackers;
        break;
      }
      case 'defend': {
        fighterSet = battle.stats.defenders;
        sideDamage = 100;
        break;
      }
    }

    for (let fighter in fighterSet) {
      let id = Number.parseInt(fighter);
      sideDamage += fighterSet[id]?.damage;
    }

    return sideDamage;
  }

  return (
    <div className='flex items-center gap-12 p-4 border border-gray-300 border-opacity-25 rounded shadow-md'>
      <div className='flex items-center gap-2 text-2xl'>
        <i className={`sot-flag sot-flag-${attacker?.flag_code}`} />
        {attacker?.name}
      </div>
      <div className='flex flex-1 flex-col gap-2'>
        <span className='text-center'>{regionName}</span>
        <div className='flex justify-center items-center gap-2 text-xl'>
          <span>{attackDmg}</span>
          <span>to</span>
          <span>{defenseDmg}</span>
        </div>
        <span className='text-center'>{isDone ? 'Finished' : `${ formatDistanceStrict(new Date(battle.end), new Date())} remaining`}</span>
      </div>
      <div className='flex items-center gap-2 text-2xl'>
        <i className={`sot-flag sot-flag-${defender?.flag_code}`} />
        {defender?.name}
      </div>
      {!props.hideBtn && (
        <Button colorScheme='blue' onClick={() => router.push(`/battle/${battle._id}${isDone ? '/view' : ''}`)}>{isDone ? 'View' : 'Fight'}</Button>
      )}
    </div>
  );
}