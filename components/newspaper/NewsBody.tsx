import { IArticle, INewspaper } from "@/models/Newspaper";
import { IUser } from "@/models/User";
import { Button } from "@chakra-ui/button";
import { List, ListItem } from "@chakra-ui/layout";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/stat";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";

interface INewsBody {
  user: IUser,
  newspaper: INewspaper,
}

const ARTICLES_PER_PAGE: number = 10;

const NewsBody: React.FC<INewsBody> = ({ user, newspaper }) => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [articles, setArticles] = useState<IArticle[]>([]);

  useEffect(() => {
    if (newspaper) {
      let endIndex = page !== 0 ?
        Math.min(page * ARTICLES_PER_PAGE, newspaper.articles.length) :
        Math.min(1, newspaper.articles.length);
      let pageArticles: IArticle[] = newspaper.articles.slice(page, endIndex);
      pageArticles.sort((a, b) => {
        let aDate = new Date(a.publishDate);
        let bDate = new Date(b.publishDate);
        if (bDate > aDate)
          return -1;
        else if (bDate < aDate)
          return 1;
        else
          return 0;
      });
      setArticles([...pageArticles]);
    }
  }, [newspaper, page]);

  const getTotalPages = () => {
    if (newspaper.articles.length % ARTICLES_PER_PAGE === 0)
      return newspaper.articles.length / ARTICLES_PER_PAGE;
    return (newspaper.articles.length / ARTICLES_PER_PAGE) + 1;
  }

  return (
    <div className='bg-night text-white rounded shadow-md w-full py-2 px-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl text-accent'>Articles</h3>
        <Button
          size='xs'
          variant='solid'
          colorScheme='green'
          leftIcon={<AiOutlinePlus />}
          onClick={() => router.push(`/newspaper/${newspaper._id}/write`)}
        >
          Write Article
        </Button>
      </div>
      <div>
        {articles.length > 0 ? (
          <List>
            {articles.map((article, idx) => (
              <ListItem key={idx} className='flex justify-between'>
                <div className='flex flex-col'>
                  <div>
                    <span>{article.title}</span>
                    {!article.published && (
                      <span className='ml-2 text-red-500'>DRAFT</span>
                    )}
                  </div>
                  <div>
                    {article.published && (
                      <span>{format(new Date(article.publishDate), 'LL/dd/yyyy')}</span>
                    )}
                  </div>
                </div>
                <div>
                  <Stat>
                    <StatLabel>LIKES</StatLabel>
                    <StatNumber>{(article.likes && article.likes.length) || 0 }</StatNumber>
                  </Stat>
                </div>
              </ListItem>
            ))}
          </List>
        ) : (
          <p className='w-max mx-auto'>This newspaper has no articles</p>
        )}
      </div>
    </div>
  );
}

export default NewsBody;