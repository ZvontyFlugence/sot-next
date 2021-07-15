import User, { IUser } from '@/models/User';
import Country, { ICountry, ILaw } from '@/models/Country';
import Layout from '@/components/Layout';
import { getCurrentUser } from '@/util/auth';
import { destroyCookie } from 'nookies';
import { jsonify } from '@/util/apiHelpers';

interface ILawPage {
  user: IUser;
  isAuthenticated: boolean;
  country: ICountry;
  law: ILaw;
  govMembersInfo: { [memberId: number]: { name: string, image: string } };
}

const LawPage: React.FC<ILawPage> = ({ user, country, ...props }) => {
  return user ? (
    <Layout user={user}>

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
    country.government.president,
    country.government.vp,
    ...Object.values(country.government.cabinet),
    ...country.government.congress.map(mem => mem.id),
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