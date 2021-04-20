import Layout from "@/components/Layout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import Country, { ICountry } from "@/models/Country";
import Region, { IRegion } from "@/models/Region";
import User, { IUser } from "@/models/User";
import { ILocationInfo, jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { destroyCookie } from "nookies";

interface IProfile {
  user: IUser,
  isAuthenticated: boolean,
  profile: IUser,
  location_info: ILocationInfo,
}

const Profile: React.FC<IProfile> = ({ profile, ...props }) => {
  return props.user ? (
    <Layout user={props.user}>
      <div className='px-24'>
        <ProfileHeader user={props.user} profile={profile} locationInfo={props.location_info} />
        <div className='mt-4'>
          {/* Profile Body */}
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
  const { req, res, params } = ctx;

  let result = await getCurrentUser(req);
  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    res.writeHead(302, {
      Location: '/login',
    });
    res.end();
    return;
  }

  const profile_id: number = Number.parseInt(params.id);

  // Get Profile
  let profile: IUser = await User.findOne({ _id: profile_id }).exec();

  if (!profile) {
    res.writeHead(302, {
      Location: '/404',
    });
    res.end();
    return;
  }

  delete profile.password;

  let location: IRegion = await Region.findOne({ _id: profile.location }).exec();
  let owner: ICountry = await Country.findOne({ _id: location.owner }).exec();
  let location_info: ILocationInfo = {
    region_name: location.name,
    owner_id: owner._id,
    owner_name: owner.name,
    owner_flag: owner.flag_code,
  }

  // TODO: Add Job, Party, Army, and Newspaper Info

  return {
    props: {
      ...result,
      profile: jsonify(profile),
      location_info: jsonify(location_info),
    }
  }
}

export default Profile;