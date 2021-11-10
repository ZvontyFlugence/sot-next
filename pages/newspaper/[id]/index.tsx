import Layout from "@/components/Layout";
import NewsBody from "@/components/newspaper/NewsBody";
import NewsHeader from "@/components/newspaper/NewsHeader";
import Newspaper, { INewspaper } from "@/models/Newspaper";
import User, { IUser } from "@/models/User";
import { ICEOInfo, jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { GetServerSideProps } from "next";
import { destroyCookie } from "nookies";
import { useState } from "react";

interface INewsPage {
  user: IUser,
  isAuthenticated: boolean,
  newspaper: INewspaper,
  author_info: ICEOInfo,
}

const NewspaperPage: React.FC<INewsPage> = ({ user, newspaper, ...props }) => {
  const [isManageMode, setManageMode] = useState(false);

  const handleChangeMode = () => {
    setManageMode(prev => !prev);
  }

  return (
    <Layout user={user}>
      <div className='flex flex-col gap-4 items-center pt-2 px-2 md:pt-0 md:px-24'>
        <NewsHeader
          userId={user._id}
          newspaper={newspaper}
          onManage={handleChangeMode}
          authorInfo={props.author_info}
        />
        <NewsBody user={user} newspaper={newspaper} />
      </div>
    </Layout>
  );
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

  let newspaper: INewspaper;
  try {
    newspaper = await Newspaper.findOne({ _id: Number.parseInt(params.id as string) }).exec();
  } catch (e) {
    return {
      redirect: {
        permanent: false,
        destination: '/404',
      },
    };
  }

  let author: IUser = await User.findOne({ _id: newspaper.author }).exec();
  let author_info: ICEOInfo = {
    ceo_id: author._id,
    ceo_name: author.username,
    ceo_image: author.image,
  };

  return {
    props: { ...result, newspaper: jsonify(newspaper), author_info: jsonify(author_info) },
  };
}

export default NewspaperPage;