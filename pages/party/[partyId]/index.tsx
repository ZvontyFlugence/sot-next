import Layout from "@/components/Layout";
import ManageParty from "@/components/party/ManageParty";
import PartyBody from "@/components/party/PartyBody";
import PartyHead from "@/components/party/PartyHead";
import { IParty } from "@/models/Party";
import { IUser } from "@/models/User";
import { getParty, ICountryInfo, ILeadershipInfo } from "@/pages/api/parties/[partyId]";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { destroyCookie } from "nookies";
import { useState } from "react";

interface IPartyPageProps {
  user: IUser,
  isAuthenticated: boolean,
  party: IParty,
  leadershipInfo: ILeadershipInfo,
  countryInfo: ICountryInfo,
}

const PartyPage: React.FC<IPartyPageProps> = ({ user, party, ...props }) => {
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
          leadershipInfo={props.leadershipInfo}
          countryInfo={props.countryInfo}
          onManage={handleChangeMode}
        />
        {isManageMode ? (
          <ManageParty user_id={user._id} party={party} />
        ) : (
          <PartyBody party={party} />
        )}
      </div>
    </Layout>
  ) : null;
};

export const getServerSideProps = async ctx => {
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

  return {
    props: {
      ...result,
      party: jsonify(party),
      leadershipInfo: jsonify(leadershipInfo),
      countryInfo: jsonify(countryInfo),
    },
  };
}

export default PartyPage;