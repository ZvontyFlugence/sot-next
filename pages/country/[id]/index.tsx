import CountryBody from "@/components/country/CountryBody";
import CountryHead from "@/components/country/CountryHead";
import Layout from "@/components/Layout";
import Country, { ICountry } from "@/models/Country";
import { IUser } from "@/models/User";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { GetServerSideProps } from "next";
import { destroyCookie } from "nookies";

interface ICountryPage {
  user: IUser,
  isAuthenticated: boolean,
  country: ICountry,
  countries: ICountry[],
}

const CountryPage: React.FC<ICountryPage> = ({ user, country, ...props }) => {
  return user ? (
    <Layout user={user}>
      <div className='px-2 pt-2 md:px-24'>
        <CountryHead country={country} countries={props.countries} />
        <div className='flex mt-4'>
          <CountryBody country={country} user={user} />
        </div>
      </div>
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

  let country_id: number = Number.parseInt(params.id as string);
  let countries: ICountry[] = await Country.find({}).exec();
  let country: ICountry = countries.find(c => c._id == country_id);

  return {
    props: {
      ...result,
      country: jsonify(country),
      countries: jsonify(countries),
    },
  };
}

export default CountryPage;