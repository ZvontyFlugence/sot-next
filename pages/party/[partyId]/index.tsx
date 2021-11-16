import Layout from '@/components/Layout';
import ManageParty from '@/components/party/ManageParty';
import PartyBody from '@/components/party/PartyBody';
import PartyHead from '@/components/party/PartyHead';
import { useUser } from '@/context/UserContext';
import Party, { IParty } from '@/models/Party';
import { getParty, ICountryInfo, ILeadershipInfo } from '@/pages/api/parties/[partyId]';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { GetServerSideProps } from 'next';
import { destroyCookie } from 'nookies';
import { useState } from 'react';

interface IPartyPageProps {
  party: IParty,
  partyRank: number,
  leadershipInfo: ILeadershipInfo,
  countryInfo: ICountryInfo,
}

const PartyPage: React.FC<IPartyPageProps> = ({ party, ...props }) => {
  const user = useUser();
  
  const [isManageMode, setManageMode] = useState<boolean>(false);

  const handleChangeMode = () => {
    setManageMode(prev => !prev);
  }

  return user ? (
    <Layout user={user}>
      <div className='flex flex-col gap-4 items-center pt-2 px-2 md:pt-0 md:px-24'>
        <PartyHead
          user_id={user._id}
          party={party}
          partyRank={props.partyRank}
          leadershipInfo={props.leadershipInfo}
          countryInfo={props.countryInfo}
          onManage={handleChangeMode}
        />
        {isManageMode ? (
          <ManageParty user_id={user._id} party={party} />
        ) : (
          <PartyBody user_id={user._id} party={party} />
        )}
      </div>
    </Layout>
  ) : null;
};

export const getServerSideProps: GetServerSideProps = async ctx => {
  let { req, params } = ctx;
  let result = await getCurrentUser(req);
  if (!result.isAuthenticated) {
    destroyCookie(null, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let partyRes = await getParty({ id: Number.parseInt(params.partyId as string), withLeadership: true, withCountry: true });
  const { party, leadershipInfo, countryInfo } = partyRes.payload;

  let parties: IParty[] = await Party.find({ country: party.country }).exec();
  let rank: number = parties.sort((a, b) => b.members.length - a.members.length).findIndex(p => p._id === party._id) + 1;

  return {
    props: {
      party: jsonify(party),
      partyRank: jsonify(rank),
      leadershipInfo: jsonify(leadershipInfo),
      countryInfo: jsonify(countryInfo),
    },
  };
}

export default PartyPage;