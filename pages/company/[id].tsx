import CompanyDetails from "@/components/company/CompanyDetails";
import CompanyHeader from "@/components/company/CompanyHeader";
import CompanyManagement from "@/components/company/CompanyManagement";
import Layout from "@/components/Layout";
import Company, { ICompany } from "@/models/Company";
import Country, { ICountry } from "@/models/Country";
import Region, { IRegion } from "@/models/Region";
import User, { IUser } from "@/models/User";
import { getCurrentUser } from "@/util/auth";
import { ICEOInfo, ILocationInfo, jsonify } from "@/util/apiHelpers";
import { destroyCookie } from 'nookies';
import { useState } from "react";
import user from "../api/stats/user";
import { GetServerSideProps } from "next";

interface ICompanyPageProps {
  user: IUser,
  isAuthenticated: boolean,
  company: ICompany,
  location_info: ILocationInfo,
  ceo_info: ICEOInfo,
  currency: string,
}

export default function CompanyPage({ user, company, location_info, ceo_info, ...props }: ICompanyPageProps) {
  const [isManageMode, setManageMode] = useState(false);
  return (
    <Layout user={user}>
      <div className='pt-2 px-2 md:pt-0 md:px-24'>
        <CompanyHeader
          company={company}
          locationInfo={location_info}
          ceoInfo={ceo_info}
          userId={user._id}
          onManage={() => setManageMode(prev => !prev)}
        />
        <div className='mt-4'>
          {!isManageMode ? (
            <CompanyDetails company={company} currency={props.currency} user={user} />
          ) : (
            <CompanyManagement company={company} currency={props.currency} locationInfo={location_info} user={user} />
          )}
        </div>
      </div>
    </Layout>
  );
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

  const company_id: number = Number.parseInt(params.id as string);
  // Ensure DB Connection
  let company: ICompany = await Company.findOne({ _id: company_id }).exec();
  if (!company) {
    return {
      redirect: {
        permanent: false,
        destination: '/404',
      },
    };
  }

  // Get Location info
  let location: IRegion = await Region.findOne({ _id: company.location }).exec();
  let owner: ICountry = await Country.findOne({ _id: location.owner }).exec();
  let location_info: ILocationInfo = {
    region_name: location.name,
    owner_id: owner._id,
    owner_name: owner.name,
    owner_flag: owner.flag_code,
  };

  // Get Owner info
  let ceo: IUser = await User.findOne({ _id: company.ceo }).exec();
  let ceo_info: ICEOInfo = {
    ceo_id: ceo._id,
    ceo_name: ceo.username,
    ceo_image: ceo.image,
  }

  // Currency Info
  let currency: string = owner.currency;

  return {
    props: {
      ...result,
      company: jsonify(company),
      location_info: jsonify(location_info),
      ceo_info: jsonify(ceo_info),
      currency: jsonify(currency),
    },
  };
}