import Layout from '@/components/Layout';
import RegionBody from '@/components/region/RegionBody';
import RegionHead from '@/components/region/RegionHead';
import { RegionPageContextProvider } from '@/context/RegionPageContext';
import { useUser } from '@/context/UserContext';
import Region, { IRegion } from '@/models/Region';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { GetServerSideProps } from 'next';
import { destroyCookie } from 'nookies';

interface IRegionPage {
  region: IRegion,
}

const RegionPage: React.FC<IRegionPage> = ({ region }: IRegionPage) => {
  const user = useUser();

  return user ? (
    <Layout user={user}>
      <RegionPageContextProvider>
        <div className='hidden md:block px-24 pb-24'>
            <RegionHead region={region} />
            <div className='mt-8'>
              <RegionBody region={region} />
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

  return {
    props: { region: jsonify(region) },
  };
}

export default RegionPage;