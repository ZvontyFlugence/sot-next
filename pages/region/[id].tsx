import Layout from "@/components/Layout";
import RegionBody from "@/components/region/RegionBody";
import RegionHead from "@/components/region/RegionHead";
import { RegionPageContextProvider } from "@/context/RegionPageContext";
import Region, { IRegion } from "@/models/Region";
import User, { IUser } from "@/models/User";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { GetServerSideProps } from "next";
import { destroyCookie } from "nookies";

interface IRegionPage {
  user: IUser,
  isAuthenticated: boolean,
  region: IRegion,
  population: number,
}

const RegionPage: React.FC<IRegionPage> = (props: IRegionPage) => {
  return props.user ? (
    <Layout user={props.user}>
      <RegionPageContextProvider>
        <div className='hidden md:block px-24'>
            <RegionHead {...props} />
            <div className='mt-8'>
              <RegionBody {...props} />
            </div>
        </div>
      </RegionPageContextProvider>
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async ctx => {
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

  let region_id = Number.parseInt(params.id as string);
  let region: IRegion = await Region.findOne({ _id: region_id }).exec();
  let residents: IUser[] = await User.find({ $or: [ { residence: region_id }, { location: region_id } ] }).exec();

  return {
    props: { ...result, region: jsonify(region), population: residents.length },
  };
}

export default RegionPage;