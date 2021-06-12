import { IArticle } from "@/models/Newspaper";
import { IUser } from "@/models/User";
import { request } from "@/util/ui";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/stat";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useQuery } from "react-query";
import Card from "../Card";

interface INews {
  user: IUser,
}

interface IArticleLink {
  article: IArticle,
}

const News: React.FC<INews> = ({ user }) => {
  const cookies = parseCookies();

  const globalNewsQuery = useQuery('getGlobalNews', () => {
    return request({
      url: '/api/newspapers/articles',
      method: 'GET',
      token: cookies.token,
    });
  });

  const { isLoading, data, error } = useQuery('getCountryNews', () => {
    return request({
      url: `/api/countries/${user.country}/articles`,
      method: 'GET',
      token: cookies.token,
    });
  });

  return (
    <div className='mt-4 px-8 md:mt-8'>
      <Card>
        <Card.Header className='text-xl font-semibold text-white h-brand'>News</Card.Header>
        <Card.Content className='text-white'>
          <Tabs orientation='horizontal'>
            <TabList>
              <Tab className='h-brand' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Global</Tab>
              <Tab className='h-brand' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Country</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {!globalNewsQuery.isLoading && !globalNewsQuery.error && (
                  <div className="flex flex-col gap-2 w-full">
                    {globalNewsQuery.data?.articles.map((article: IArticle, i: number) => (
                      <ArticleLink key={i} article={article} />
                    ))}
                  </div>
                )}
              </TabPanel>
              <TabPanel>
                {!isLoading && !error && (
                  <div className='flex flex-col gap-2 w-full'>
                    {data?.articles.map((article: IArticle, i: number) => (
                      <ArticleLink key={i} article={article} />
                    ))}
                  </div>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Card.Content>
      </Card>
    </div>
  );
}

const ArticleLink: React.FC<IArticleLink> = ({ article }) => {
  const router = useRouter();

  return (
    <div className='flex justify-between items-center mx-0 md:mx-4 cursor-pointer' onClick={() => router.push(`/newspaper/${article?.newspaper}/article/${article.id}`)}>
      <div className='flex flex-col flex-grow'>
        <p className='text-accent font-semibold text-lg'>{article.title}</p>
        <span>Published: {format(new Date(article.publishDate), 'MM/dd/yyyy')}</span>
      </div>
      <div>
        <Stat>
          <StatLabel>LIKES</StatLabel>
          <StatNumber className='text-center'>{article.likes.length}</StatNumber>
        </Stat>
      </div>
    </div>
  );
}

export default News;