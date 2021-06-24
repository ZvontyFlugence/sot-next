import { EconomicStance, IParty, SocialStance } from "@/models/Party";
import { ILeadershipInfo, ICountryInfo } from '@/pages/api/parties/[partyId]';
import { Avatar } from "@chakra-ui/avatar";
import { IconButton } from "@chakra-ui/button";
import { EditIcon } from "@chakra-ui/icons";
import { Image } from "@chakra-ui/image";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/stat";
import { Tag } from "@chakra-ui/tag";
import { useRouter } from "next/router";
import { ImEnter, ImExit } from 'react-icons/im';

interface IPartyHeadProps {
  user_id: number,
  party: IParty,
  partyRank: number,
  leadershipInfo: ILeadershipInfo,
  countryInfo: ICountryInfo,
  onManage: () => void,
}

const PartyHead: React.FC<IPartyHeadProps> = ({ party, leadershipInfo, countryInfo, ...props }) => {
  const router = useRouter();

  const handleJoin = () => {

  }

  const handleLeave = () => {

  }

  return (
    <>
      <div className='hidden md:block p-4 w-full bg-night text-white rounded shadow-md'>
        <div className='flex flex-row items-stretch gap-4'>
          <Image boxSize='12.0rem' src={party.image} alt={party.name} borderRadius='full' />
          <div className='flex flex-col w-full items-start'>
            <h3 className='text-2xl font-semibold text-accent'>
              {party.name}
              <i
                className={`ml-4 cursor-pointer flag-icon flag-icon-${countryInfo.flag}`}
                onClick={() => router.push(`/country/${party.country}`)}
                title={countryInfo.name}
              />
            </h3>
            <div className='flex items-center gap-8 mt-2'>
              <div className='flex items-center'>
                Party President:
                {party.president !== -1 ? (
                  <Tag className='flex gap-2 ml-2 cursor-pointer' bgColor='transparent' onClick={() => router.push(`/profile/${party.president}`)}>
                    <Avatar boxSize='3.0rem' src={leadershipInfo?.president.image} name={leadershipInfo?.president.name} />
                    <span className='text-base text-white'>{leadershipInfo?.president.name}</span>
                  </Tag>
                ) : (
                  <span className='ml-2'>None</span>
                )}
              </div>
              <div className='flex items-center'>
                Vice Party President:
                {party.vp !== -1 ? (
                  <Tag className='flex gap-2 ml-2 cursor-pointer' bgColor='transparent' onClick={() => router.push(`/profile/${party.vp}`)}>
                    <Avatar boxSize='3.0rem' src={leadershipInfo?.vp.image} name={leadershipInfo?.vp.name} />
                    <span className='text-base text-white'>{leadershipInfo?.vp.name}</span>
                  </Tag>
                ) : (
                  <span className='ml-2'>None</span>
                )}
              </div>
            </div>
            <div className='flex items-center gap-8 mt-2'>
              <span>Economic Stance: {EconomicStance.toString(party.economicStance as EconomicStance)}</span>
              <span>Social Stance: {SocialStance.toString(party.socialStance as SocialStance)}</span>
            </div>
            <div className='flex items-center gap-8 mt-8'>
              <Stat className='cursor-pointer' onClick={() => router.push(`/rankings/${party.country}/parties`)}>
                <StatLabel>Rank</StatLabel>
                <StatNumber className='text-center'>{props.partyRank}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Members</StatLabel>
                <StatNumber className='text-center'>{party.members.length}</StatNumber>
              </Stat>
            </div>
          </div>
          <div className='flex flex-col justify-self-start self-start gap-4'>
            {props.user_id === party.president && (
              <IconButton
                aria-label='Manage Party Button'
                variant='outline'
                colorScheme=''
                icon={<EditIcon />}
                onClick={props.onManage}
                title='Manage Party'
              />
            )}
            {party.members.includes(props.user_id) ? (
                <IconButton
                  aria-label='Leave Party Button'
                  variant='outline'
                  colorScheme='red'
                  icon={<ImExit />}
                  onClick={handleLeave}
                  title='Leave Party'
                />
              ) : (
                <IconButton
                  aria-label='Join Party Button'
                  variant='outline'
                  colorScheme='blue'
                  icon={<ImEnter />}
                  onClick={handleJoin}
                  title='Join Party'
                />
              )}      
          </div>
        </div>
      </div>
      <div className='block md:hidden bg-night text-white p-4 shadow-md rounded w-full'>
        <div className='flex flex-col items-stretch gap-2 w-full'>
          <div className='flex justify-between items-center gap-2 w-full'>
            <div className='flex gap-2 items-center flex-grow'>
              <Image boxSize='3.5rem' src={party.image} alt={party.name} borderRadius='full' />
              <h3 className='text-xl font-semibold text-accent'>
                {party.name}
                <i
                  className={`ml-2 cursor-pointer flag-icon flag-icon-${countryInfo.flag}`}
                  onClick={() => router.push(`/country/${party.country}`)}
                  title={countryInfo.name}
                />
              </h3>
            </div>
            <div className='flex flex-col gap-2 items-center'>
              {props.user_id === party.president && (
                <IconButton
                  aria-label='Manage Party Button'
                  variant='outline'
                  size='sm'
                  colorScheme=''
                  icon={<EditIcon />}
                  onClick={props.onManage}
                  title='Manage Party'
                />
              )}
              {party.members.includes(props.user_id) ? (
                <IconButton
                  aria-label='Leave Party Button'
                  variant='outline'
                  size='sm'
                  colorScheme='red'
                  icon={<ImEnter />}
                  onClick={handleLeave}
                  title='Leave Party'
                />
              ) : (
                <IconButton
                  aria-label='Join Party Button'
                  variant='outline'
                  size='sm'
                  colorScheme='blue'
                  icon={<ImEnter />}
                  onClick={handleJoin}
                  title='Join Party'
                />
              )}
            </div>          
          </div>
          <div className='text-base'>
            <div className='flex items-center'>
              Party President:
              {party.president !== -1 ? (
                <Tag className='flex gap-2 ml-2 cursor-pointer' bgColor='transparent' onClick={() => router.push(`/profile/${party.president}`)}>
                  <Avatar boxSize='2.0rem' src={leadershipInfo?.president.image} name={leadershipInfo?.president.name} />
                  <span className='text-white'>{leadershipInfo?.president.name}</span>
                </Tag>
              ) : (
                <span className='ml-2'>None</span>
              )}
            </div>
            <div className='flex items-center'>
              Vice Party President:
              {party.vp !== -1 ? (
                <Tag className='flex gap-2 ml-2 cursor-pointer' bgColor='transparent' onClick={() => router.push(`/profile/${party.vp}`)}>
                  <Avatar boxSize='2.0rem' src={leadershipInfo?.vp.image} name={leadershipInfo?.vp.name} />
                  <span className='text-white'>{leadershipInfo?.vp.name}</span>
                </Tag>
              ) : (
                <span className='ml-2'>None</span>
              )}
            </div>
            <div className='mt-2'>
              <Stat>
                <StatLabel>Members</StatLabel>
                <StatNumber>{party.members.length}</StatNumber>
              </Stat>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PartyHead;