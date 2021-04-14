import { Button, Center, Grid, GridItem, Image } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { useRouter } from 'next/router';

import Features from '@/components/index/Features';
import TopCitizens from '@/components/index/TopCitizens';
import Nav from '@/components/Nav';
import TopCountries from '@/components/index/TopCountries';
import { getCurrentUser } from '@/util/auth';
import { IUser } from '@/models/User';

interface IIndexProps {
  user: IUser,
  isAuthenticated: boolean,
}

export default function Index(props: IIndexProps) {
  const router = useRouter();

  const citizenQuery = useQuery('topCits', async () => {
    return fetch('/api/stats/user?scope=global&stat=xp&limit=5')
      .then(res => res.json());
  });

  const countryQuery = useQuery('topNations', async () => {
    return fetch('/api/stats/country?stat=population&limit=5')
      .then(res => res.json());
  });
  
  return (
    <div className='w-full max-h-full overflow-hidden'>
      <Nav />
      <div className='flex flex-col items-center mt-8'>
        <Image boxSize='11.0rem' src={process.env.LOGO} alt='State of Turmoil Logo' />
        <h1 className='text-4xl font-semibold'>State of Turmoil</h1>
        <Button
          className='mt-4'
          variant='solid'
          colorScheme='blackAlpha'
          onClick={() => router.push('/register')}
        >
          Join Today
        </Button>
      </div>
      <div className='mt-6 px-8 w-full'>
        <Grid templateColumns='repeat(4, 1fr)' gap={6}>
          <GridItem colSpan={1}>
            <TopCountries countries={(countryQuery.isLoading || countryQuery.error) ? [] : countryQuery?.data?.countries} />
          </GridItem>
          <GridItem colStart={2} colEnd={4}>
          <Features />
          </GridItem>
          <GridItem colSpan={1}>
            <TopCitizens citizens={(citizenQuery.isLoading || citizenQuery.error) ? [] : citizenQuery?.data?.citizens} />
          </GridItem>
        </Grid>
      </div>
    </div>
  );
}

export const getServerSideProps = async ctx => {
  const { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (result.isAuthenticated) {
    res.writeHead(302, {
      Location: '/dashboard',
    });
    res.end();
    return;
  }

  return {
    props: { ...result }
  }
}