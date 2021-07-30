import { ILaw } from '@/models/Country';
import { LawType } from '@/util/apiHelpers';
import { Button, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
import { format, formatDuration } from 'date-fns';
import { useRouter } from 'next/router';

interface ILawLink {
    countryId: number;
    law: ILaw;
}

function LawLink({ countryId, law }: ILawLink) {
	const router = useRouter();

	const getLawName = () => {
		switch (law.type) {
        case LawType.ALLIANCE:
            return 'Create Alliance With Country';
        case LawType.EMBARGO:
            return 'Embargo Country';
		case LawType.INCOME_TAX:
				return 'Change Income Tax';
		case LawType.IMPORT_TAX:
				return 'Change Import Tax';
		case LawType.MINIMUM_WAGE:
				return 'Change Minimum Wage';
		case LawType.PRINT_MONEY:
				return 'Print Money';
		case LawType.VAT_TAX:
				return 'Change VAT Tax';
		default:
				return 'Unknown Law';
		}
	}

	const getTimeRemaining = () => {
		let now = new Date(Date.now());
		let expires = new Date(law.expires);

		return expires > now ? `Expires in ${formatDuration({
		hours: 24 - Math.abs(now.getUTCHours() - expires.getUTCHours()),
		minutes: 60 - Math.abs(now.getUTCMinutes() - expires.getUTCMinutes())
		})}` : `Expired on ${format(expires, 'MM/dd/yyyy')}`;
	}

	const getStatus = () => {
		if (law.passed === undefined)
			return '';
		
		return `(${law.passed ? 'Passed' : 'Failed'})`;
	}

    return (
        <div className='flex items-center justify-between w-full px-4 py-2 border border-white border-opacity-25 rounded shadow-md'>
        <div className='flex flex-col gap-2'>
            <span className='text-accent-alt text-xl'>{getLawName()} {getStatus()}</span>
            <span>{getTimeRemaining()}</span>
        </div>
        <div className='hidden md:flex items-center gap-8'>
            <Stat>
                <StatLabel>Yes</StatLabel>
                <StatNumber className='text-center'>
                    {law.votes.filter(vote => vote.choice === 'yes').length}
                </StatNumber>
            </Stat>
            <Stat>
                <StatLabel>Abstain</StatLabel>
                <StatNumber className='text-center'>
                    {law.votes.filter(vote => vote.choice === 'abstain').length}
                </StatNumber>
            </Stat>
            <Stat>
                <StatLabel>No</StatLabel>
                <StatNumber className='text-center'>
                    {law.votes.filter(vote => vote.choice === 'no').length}
                </StatNumber>
            </Stat>            
        </div>
        <div>
            <Button size='sm' colorScheme='blue' onClick={() => router.push(`/country/${countryId}/law/${law.id}`)}>
                {new Date(law.expires) > new Date(Date.now()) ? 'Vote' : 'View'}
            </Button>
        </div>
        </div>
    );
}

export default LawLink;