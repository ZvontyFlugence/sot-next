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
    <div className='w-full md:max-h-full md:overflow-hidden'>
      <Nav />
      <div className='flex flex-col items-center'>
        <Image boxSize='xs' src={process.env.NEXT_PUBLIC_LOGO} alt='State of Turmoil Logo' />
        <Button
          className='-mt-8 bg-accent-alt text-white'
          variant='solid'
          colorScheme=''
          onClick={() => router.push('/register')}
        >
          Join Today
        </Button>
      </div>
      <div className='hidden md:block mt-6 px-8 w-full'>
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
      <div className='flex md:hidden flex-col justify-center items-center gap-4 mt-6 px-8 w-full'>
        <Features />
        <TopCountries countries={(countryQuery.isLoading || countryQuery.error) ? [] : countryQuery?.data?.countries} />      
        <TopCitizens citizens={(citizenQuery.isLoading || citizenQuery.error) ? [] : citizenQuery?.data?.citizens} />
      </div>
    </div>
  );
}

export const getServerSideProps = async ctx => {
  const { req } = ctx;

  let result = await getCurrentUser(req);

  if (result.isAuthenticated) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  return {
    props: { ...result },
  };
}
