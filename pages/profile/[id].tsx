import Layout from "@/components/Layout";
import FriendsList, { IFriendListItem } from "@/components/profile/FriendsList";
import ProfileActivities from "@/components/profile/ProfileActivities";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import { useUser } from "@/context/UserContext";
import Company, { ICompany } from "@/models/Company";
import Country, { ICountry } from "@/models/Country";
import Newspaper, { INewspaper } from "@/models/Newspaper";
import Party, { IParty } from "@/models/Party";
import Region, { IRegion } from "@/models/Region";
import User, { IUser } from "@/models/User";
import { ILocationInfo, jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { GetServerSideProps } from "next";
import { destroyCookie } from "nookies";

interface IProfile {
  profile: IUser,
  location_info: ILocationInfo,
  residence_info: ILocationInfo,
  job_info: IActivityInfo,
  party_info: IActivityInfo,
  army_info: IActivityInfo,
  news_info: IActivityInfo,
  friends_info: IFriendListItem[],
}

export interface IActivityInfo {
  id: number,
  image: string,
  name: string,
  title: string,
}

const Profile: React.FC<IProfile> = ({ profile, ...props }) => {
  const user = useUser();

  return user ? (
    <Layout user={user}>
      <div className='hidden md:block px-24'>
        <ProfileHeader
          user={user}
          profile={profile}
          locationInfo={props.location_info}
          residenceInfo={props.residence_info}
        />
        <div className='flex gap-4 mt-4'>
          <div className='w-1/4'>
            <ProfileActivities
              profile={profile}
              jobInfo={props.job_info}
              partyInfo={props.party_info}
              armyInfo={props.army_info}
              newsInfo={props.news_info}
            />
          </div>
          <div className='w-3/4 flex flex-col gap-4'>
            <div className='bg-night text-white p-4 shadow-md rounded'>
              <p className='h-brand text-accent text-xl'>Stats & Achievements</p>
              <ProfileStats profile={profile} />
            </div>
            <div className='bg-night text-white p-4 shadow-md rounded'>
              <p className='h-brand text-accent text-xl'>Friends List</p>
              <FriendsList friends={props.friends_info} />
            </div>
          </div>
        </div>
      </div>
      <div className='block md:hidden px-2'>
        <ProfileHeader
          user={user}
          profile={profile}
          locationInfo={props.location_info}
          residenceInfo={props.residence_info}
        />
        <div className='flex gap-2 mt-4'>
          <div className='w-1/2'>
            <ProfileActivities
              profile={profile}
              jobInfo={props.job_info}
              partyInfo={props.party_info}
              armyInfo={props.army_info}
              newsInfo={props.news_info}
            />
          </div>
          <div className='w-1/2 flex flex-col gap-4'>
            <div className='bg-night text-white p-4 shadow-md rounded'>
              <p className='h-brand text-accent text-xl'>Stats</p>
              <ProfileStats profile={profile} />
            </div>
            <div className='bg-night text-white p-4 shadow-md rounded'>
              <p className='h-brand text-accent text-xl'>Friends List</p>
              <FriendsList friends={props.friends_info} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const { req, params } = ctx;

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

  const profile_id: number = Number.parseInt(params.id as string);

  // Get Profile
  let profile: IUser = await User.findOne({ _id: profile_id }).exec();

  if (!profile) {
    return {
      redirect: {
        permanent: false,
        destination: '/404',
      },
    };
  }

  delete profile.password;

  let location: IRegion = await Region.findOne({ _id: profile.location }).exec();
  let owner: ICountry = await Country.findOne({ _id: location.owner }).exec();
  let location_info: ILocationInfo = {
    region_name: location.name,
    owner_id: owner._id,
    owner_name: owner.name,
    owner_flag: owner.flag_code,
  };

  let residence: IRegion = await Region.findOne({ _id: profile.residence }).exec();
  let residenceOwner: ICountry = await Country.findOne({ _id: residence.owner }).exec();
  let residence_info: ILocationInfo = {
    region_name: residence.name,
    owner_id: residenceOwner._id,
    owner_name: residenceOwner.name,
    owner_flag: residenceOwner.flag_code,
  };

  let job_info: IActivityInfo = null;
  let party_info: IActivityInfo = null;
  let army_info: IActivityInfo = null;
  let news_info: IActivityInfo = null;
  let friends_info: IFriendListItem[] = [];

  if (profile.job) {
    let job: ICompany = await Company.findOne({ _id: profile.job });
    job_info = {
      id: job._id,
      image: job.image,
      name: job.name,
      title: job.employees.find(emp => emp.user_id === profile._id)?.title || '',
    };
  }

  if (profile.friends.length > 0) {
    let friends: IUser[] = await User.find({ _id: { $in: profile.friends } }).exec();
    friends_info = friends.map(friend => {
      return {
        id: friend._id,
        username: friend.username,
        image: friend.image,
      }
    });
  }

  if (profile.party > 0) {
    let party: IParty = await Party.findOne({ _id: profile.party }).exec();
    let role: string = '';

    switch (profile._id) {
      case party.president: {
        role = 'Party President';
        break;
      }
      case party.vp: {
        role = 'Vice Party President';
        break;
      }
      default: {
        role = 'Member';
        break;
      }
    }

    party_info = {
      id: party._id,
      image: party.image,
      name: party.name,
      title: role,
    };
  }

  // TODO: Implement
  if (profile.unit > 0) {

  }

  if (profile.newspaper > 0) {
    let newspaper: INewspaper = await Newspaper.findOne({ _id: profile.newspaper }).exec();
    news_info = {
      id: newspaper._id,
      image: newspaper.image,
      name: newspaper.name,
      title: 'Author',
    };
  }

  return {
    props: {
      profile: jsonify(profile),
      location_info: jsonify(location_info),
      residence_info: jsonify(residence_info),
      job_info: jsonify(job_info),
      party_info: jsonify(party_info),
      army_info: jsonify(army_info),
      news_info: jsonify(news_info),
      friends_info: jsonify(friends_info),
    }
  }
}

export default Profile;