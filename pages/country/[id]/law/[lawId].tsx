import User, { IUser } from '@/models/User';
import Country, { IChangeImportTax, IChangeIncomeTax, ICountry, ILaw, ILawVote } from '@/models/Country';
import Layout from '@/components/Layout';
import { getCurrentUser } from '@/util/auth';
import { destroyCookie, parseCookies } from 'nookies';
import { jsonify, LawType } from '@/util/apiHelpers';
import { Avatar, Button, Stat, StatHelpText, StatLabel, StatNumber, Tag, TagLabel, useToast } from '@chakra-ui/react';
import { addMinutes, format } from 'date-fns';
import { useRouter } from 'next/router';
import { GovActions } from '@/util/actions';
import { IGameItem, refreshData, request, showToast } from '@/util/ui';
import { ITEMS } from '@/util/constants';

interface ILawPage {
  user: IUser;
  isAuthenticated: boolean;
  country: ICountry;
  law: ILaw;
  govMembersInfo: { [memberId: number]: { name: string, image: string } };
}

const LawPage: React.FC<ILawPage> = ({ user, country, law, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const yesVotes: ILawVote[] = law?.votes.filter(vote => vote.choice === 'yes') ?? [];
  const noVotes: ILawVote[] = law?.votes.filter(vote => vote.choice === 'no') ?? [];
  const abstainVotes: ILawVote[] = law?.votes.filter(vote => vote.choice === 'abstain') ?? [];

  const getLawText = (): string => {
    switch (law.type) {
      case LawType.INCOME_TAX:
        return 'Change Income Tax Law Proposal';
      case LawType.IMPORT_TAX:
        return 'Change Import Tax Law Proposal';
      case LawType.VAT_TAX:
        return 'Change VAT Tax Law Proposal';
      default:
        return '';
    }
  }

  const getLawStatus = (): string => {
    if (new Date(law.expires) > new Date(Date.now()))
      return 'Pending';
    else if (law.passed)
      return 'Passed';
    
    return 'Failed';
  }

  const getProposalDescription = (): string | React.ReactElement => {
    switch (law.type) {
      case LawType.INCOME_TAX:
        return ` proposed changing the income tax from ${country.policies.taxes.income}% to ${(law.details as IChangeIncomeTax).percentage}%`;
      case LawType.IMPORT_TAX:
      case LawType.VAT_TAX: {
        let productId: number = Number.parseInt(Object.keys(law.details)[0]) ?? -1;
        if (productId === -1)
          return '';

        let item: IGameItem = ITEMS[productId];

        return (
          <span className='flex items-center gap-2'>
            proposed changing the {law.type === LawType.IMPORT_TAX ? 'import' : 'VAT'} tax for
            <i className={item.image} title={item.name} />
            {item.name} to {(law.details as IChangeImportTax)[productId]}%
          </span>
        );
      }
      default:
        return '';
    }
  }

  const isGovMember = (): boolean => {
    return (
      user._id === country.government.president ||
      user._id === country.government.vp ||
      Object.values(country.government.cabinet).includes(user._id) ||
      country.government.congress.findIndex(member => member.id === user._id) !== -1
    );
  }

  const canVote = (): boolean => {
    return (
      law.votes.findIndex(vote => vote.id === user._id) === -1 && // User hasn't voted already
      law.passed === undefined && // Law hasn't expired yet
      isGovMember()// User is a valid govMember
    );
  }

  const handleVote = (vote: string) => {
    let payload = {
      action: GovActions.VOTE_LAW,
      data: { lawId: law.id, vote },
    };

    request({
      url: `/api/countries/${country._id}/doGovAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Law Proposal Vote Failed', data?.error);
      }
    });
  }

  return user ? (
    <Layout user={user}>
      <div className='px-2 pt-2 md:px-24 text-white'>
        <div className='p-4 bg-night rounded shadow-md'>
          <h1 className='text-accent text-2xl'>
            {getLawText()} ({getLawStatus()})
            <i className={`ml-4 cursor-pointer flag-icon flag-icon-${country.flag_code}`} title={country.name} onClick={() => router.push(`/country/${country._id}`)} />
          </h1>
          <h3>
            <span>
              Proposed on {format(addMinutes(new Date(law.proposed), new Date(law.proposed).getTimezoneOffset()), 'MM/dd/yyyy HH:mm')}
            </span>
            <span className='ml-4'>
              {getLawStatus() === 'Pending' ? 'Expires' : 'Expired'} on {format(addMinutes(new Date(law.expires), new Date(law.expires).getTimezoneOffset()), 'MM/dd/yyyy HH:mm')}
            </span>
          </h3>
          <p className='flex justify-center items-center mt-4'>
            <Tag className='cursor-pointer' size='md' colorScheme='transparent' onClick={() => router.push(`/profile/${law.proposedBy}`)}>
              <Avatar
                src={props.govMembersInfo[law.proposedBy].image}
                size='sm'
                name={props.govMembersInfo[law.proposedBy]?.name}
                ml={-1}
                mr={2}
              />
              <TagLabel className='text-accent-alt'>{props.govMembersInfo[law.proposedBy]?.name}</TagLabel>
            </Tag>
            <span>
              {getProposalDescription()}
            </span>
          </p>
        </div>
        <div className='flex items-start justify-evenly mt-4 p-4 bg-night rounded shadow-md'>
          <div className='flex flex-col items-center gap-4 text-xl'>
            <Stat>
              <StatLabel className='text-center'>Yes</StatLabel>
              <StatNumber className='text-center'>
                {yesVotes.length}
              </StatNumber>
              {canVote() && (
                <StatHelpText className='mt-2'>
                  <Button size='sm' colorScheme='green' onClick={() => handleVote('yes')}>Vote Yes</Button>
                </StatHelpText>
              )}            
            </Stat>
            {yesVotes.map(({ id, choice: _choice }: ILawVote, i: number) => (
              <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${id}`)}>
                <Avatar src={props.govMembersInfo[id].image} name={props.govMembersInfo[id]?.name} />
                <span>{props.govMembersInfo[id]?.name}</span>
              </div>
            ))}
          </div>
          <div className='flex flex-col gap-4'>
            <Stat>
              <StatLabel className='text-center'>Abstain</StatLabel>
              <StatNumber className='text-center'>
                {abstainVotes.length}
              </StatNumber>
              {canVote() && (
                <StatHelpText className='mt-2'>
                  <Button size='sm' colorScheme='gray' color='night' onClick={() => handleVote('abstain')}>Vote Abstain</Button>
                </StatHelpText>
              )}            
            </Stat>
            {abstainVotes.map(({ id, choice: _choice }: ILawVote, i: number) => (
              <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${id}`)}>
                <Avatar src={props.govMembersInfo[id].image} name={props.govMembersInfo[id]?.name} />
                <span>{props.govMembersInfo[id]?.name}</span>
              </div>
            ))}
          </div>
          <div className='flex flex-col gap-4'>
            <Stat>
              <StatLabel className='text-center'>No</StatLabel>
              <StatNumber className='text-center'>
                {noVotes.length}
              </StatNumber>
              {canVote() && (
                <StatHelpText className='mt-2'>
                  <Button size='sm' colorScheme='red' onClick={() => handleVote('no')}>Vote No</Button>
                </StatHelpText>
              )}
            </Stat>
            {noVotes.map(({ id, choice: _choice }: ILawVote, i: number) => (
              <div key={i} className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${id}`)}>
                <Avatar src={props.govMembersInfo[id].image} name={props.govMembersInfo[id]?.name} />
                <span>{props.govMembersInfo[id]?.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async (ctx) => {
  let { req, params } = ctx;

  let result = await getCurrentUser(req);
  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let country_id: number = Number.parseInt(params.id);
  let law_id: string = params.lawId;
  let country: ICountry = await Country.findOne({ _id: country_id }).exec();
  let law: ILaw = [...country.pendingLaws, ...country.pastLaws].find(bill => bill.id === law_id);

  let govMembers: number[] = [
    law.proposedBy,
    ...law.votes.map(vote => vote.id),
  ];

  let govMembersInfo: { [memberId: number]: { name: string, image: string } } = {};
  let members: IUser[] = await User.find({ _id: { $in: govMembers } }).exec();

  for (let member of members) {
    govMembersInfo[member._id] = { name: member.username, image: member.image };
  }

  return {
    props: {
      ...result,
      country: jsonify(country),
      law: jsonify(law),
      govMembersInfo: jsonify(govMembersInfo),
    },
  };
}

export default LawPage;