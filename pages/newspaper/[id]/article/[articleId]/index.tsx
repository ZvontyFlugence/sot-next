import Layout from "@/components/Layout";
import Newspaper, { IArticle, INewspaper } from "@/models/Newspaper";
import User, { IUser } from "@/models/User";
import { UserActions } from "@/util/actions";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { refreshData, request, showToast } from "@/util/ui";
import { Button, ButtonGroup } from "@chakra-ui/button";
import { Image } from "@chakra-ui/image";
import { Tag } from "@chakra-ui/tag";
import { useToast } from "@chakra-ui/toast";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from "nookies";
import { useEffect, useState } from "react";
import { AiOutlineLike } from "react-icons/ai";
import { FiRss } from 'react-icons/fi';

interface IArticlePage {
  user: IUser,
  isAuthenticated: boolean,
  newspaper: INewspaper,
  authorInfo: IUser,
  articleId: string,
}

const ArticlePage: React.FC<IArticlePage> = ({ user, newspaper, authorInfo, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [article, setArticle] = useState<IArticle | null>(null);

  useEffect(() => {
    let targetArticle = newspaper.articles.find(a => a.id === props.articleId);
    setArticle(targetArticle);
  }, []);

  const onLikeClick = () => {
    if (article.likes.includes(user._id)) {
      handleUnlike();
    } else {
      handleLike();
    }
  }

  const handleLike = () => {
    let payload = {
      action: UserActions.LIKE_ARTICLE,
      data: {
        newsId: newspaper._id,
        articleId: props.articleId,
      },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Like Article Failed', data?.error);
      }
    });
  }

  const handleUnlike = () => {
    let payload = {
      action: UserActions.UNLIKE_ARTICLE,
      data: {
        newsId: newspaper._id,
        articleId: props.articleId,
      },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Unlike Article Failed', data?.error);
      }
    });
  }

  const onSubscribeClick = () => {
    if (newspaper.subscribers.includes(user._id)) {
      handleUnsubscribe();
    } else {
      handleSubscribe();
    }
  }

  const handleSubscribe = () => {
    let payload = {
      action: UserActions.SUBSCRIBE,
      data: {
        newsId: newspaper._id,
      },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Subscribe Failed', data?.error);
      }
    });
  }

  const handleUnsubscribe = () => {
    let payload = {
      action: UserActions.UNSUBSCRIBE,
      data: {
        newsId: newspaper._id,
      },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Unsubscribe Failed', data?.error);
      }
    });
  }

  return user ? (
    <Layout user={user}>
      {article && (
        <>
          <div className='hidden md:flex bg-night shadow-md rounded ml-8 mr-12 p-4'>
            <div className='flex flex-col gap-4 flex-grow'>
              <div className='flex items-center'>
                <h3 className='text-2xl text-accent font-semibold'>{article.title}</h3>
                <span className='ml-4 text-white'>{format(new Date(article.publishDate), 'MM/dd/yyyy')}</span>
              </div>            
              <div className='flex items-center gap-8 h-max flex-grow text-white'>
                <div className='flex items-center'>
                  <span className='mr-2'>Newspaper:</span>
                  <Tag className='cursor-pointer' bgColor='transparent' onClick={() => router.push(`/newspaper/${newspaper._id}`)}>
                    <Image boxSize='2.5rem' src={newspaper.image} alt={newspaper.name} />
                    <span className='ml-2 text-accent-alt'>{newspaper.name}</span>
                  </Tag>
                </div>
                <div className='flex items-center'>
                  <span className='mr-2'>Author:</span>
                  <Tag className='cursor-pointer' bgColor='transparent' onClick={() => router.push(`/profile/${authorInfo._id}`)}>
                    <Image boxSize='2.5rem' src={authorInfo.image} alt={authorInfo.username} />
                    <span className='ml-2 text-accent-alt'>{authorInfo.username}</span>
                  </Tag>
                </div>
              </div>
            </div>
            <div className='flex flex-col items-center gap-4'>
              <ButtonGroup isAttached>
                <Tag className='w-12' variant='outline' colorScheme='red' bgColor='whiteAlpha.200' color='white' borderRightRadius='none'>
                  <span className='w-full text-center'>{article.likes.length}</span>
                </Tag>
                <Button leftIcon={<AiOutlineLike />} colorScheme='red' borderLeftRadius='none' onClick={onLikeClick}>
                  {article.likes.includes(user._id) ? 'Unlike' : 'Like'}  
                </Button>          
              </ButtonGroup>
              <ButtonGroup isAttached>
                <Tag className='w-12' variant='outline' colorScheme='blue' bgColor='whiteAlpha.200' color='white' borderRightRadius='none'>
                  <span className='w-full text-center'>{newspaper.subscribers.length}</span>
                </Tag>
                <Button leftIcon={<FiRss />} colorScheme='blue' borderLeftRadius='none' onClick={onSubscribeClick}>
                  {newspaper.subscribers.includes(user._id) ? 'Unsubscribe' : 'Subscribe'}
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </>
      )}
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

  let newspaper: INewspaper = await Newspaper.findOne({ _id: Number.parseInt(params.id) }).exec();
  let news_author: IUser = await User.findOne({ _id: newspaper.author }).exec();
  
  return {
    props: {
      ...result,
      newspaper: jsonify(newspaper),
      authorInfo: jsonify(news_author),
      articleId: params.articleId as string,
    },
  };
}

export default ArticlePage;