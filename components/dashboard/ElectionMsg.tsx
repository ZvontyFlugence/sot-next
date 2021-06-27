import { ElectionType } from '@/models/Election';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';

interface IElectionMsg {
  country: number,
  party: number,
  day: number,
  month: number,
  year: number,
}

const ElectionMsg: React.FC<IElectionMsg> = ({ country, party, day, month, year }) => {
  const router = useRouter();
  
  const getElectionType = () => {
    switch (day) {
      case 5:
        return ElectionType.CountryPresident;
      case 15:
        return ElectionType.Congress;
      case 25:
        return ElectionType.PartyPresident;
      default:
        return null;
    }
  }

  const goToElection = () => {
    switch (getElectionType()) {
      case ElectionType.CountryPresident:
        router.push(`/election/country/${country}/${year}/${month}`);
        break;
      case ElectionType.Congress:
        router.push(`/election/congress/${country}/${year}/${month}`);
        break;
      case ElectionType.PartyPresident:
        router.push(`/election/party/${party}/${year}/${month}`);
        break;
      default:
        return;
    }
  }

  return getElectionType() !== null ? (
    <div className='flex justify-center my-4'>
      <div className='px-4 py-2 rounded shadow-md bg-blue-300 bg-opacity-50'>
        <p className='text-white font-semibold'>
          {getElectionType() === ElectionType.CountryPresident && (
            <span>Country President Elections are currently underway!</span>
          )}
          {getElectionType() === ElectionType.Congress && (
            <span>Congressional Elections are currently underway!</span>
          )}
          {getElectionType() === ElectionType.PartyPresident && (
            <span>Political Party President Elections are currently underway!</span>
          )}
        </p>
        <Button
          className='mt-2 mx-auto'
          size='sm'
          colorScheme='whiteAlpha'
          onClick={goToElection}
        >
          Go Vote
        </Button>
      </div>
    </div>
  ) : null;
}

export default ElectionMsg;