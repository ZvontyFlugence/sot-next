import Layout from "@/components/Layout";
import Region, { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { destroyCookie } from "nookies";

interface IRegionPage {
  user: IUser,
  isAuthenticated: boolean,
  region: IRegion,
}

const RegionPage: React.FC<IRegionPage> = ({ user, region, ...props }) => {
  return user ? (
    <Layout user={user}>
      
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
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

  let region: IRegion = await Region.findOne({ _id: params.id }).exec();

  return {
    props: { ...result, region: jsonify(region) },
  };
}

export default RegionPage;