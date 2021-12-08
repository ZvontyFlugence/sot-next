import { Button, Grid, GridItem, Image } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import Features from '@/components/index/Features';
import TopCitizens from '@/components/index/TopCitizens';
import Nav from '@/components/Nav';
import TopCountries from '@/components/index/TopCountries';
import { getCurrentUser } from '@/util/auth';
import { GetServerSideProps } from 'next';
import useSWR from 'swr';
import { request } from '@/util/ui';

export const topCitizensFetcher = (url: string) => request({ url, method: 'GET' });
export const topNationsFetcher = (url: string) => request({ url, method: 'GET' });

export default function Index() {
  const router = useRouter();

  const citizenQuery = useSWR('/api/stats/user?scope=global&stat=xp&limit=5', topCitizensFetcher);
  const countryQuery = useSWR('/api/stats/country?stat=population&limit=5', topNationsFetcher);
  
  return (
    <div className='w-full md:max-h-full md:overflow-hidden'>
      <Nav />
      <div className='flex flex-col items-center'>
        <Image boxSize='xs' src='/logo_transparent.png' alt='State of Turmoil Logo' />
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
            <TopCountries countries={countryQuery?.data ? countryQuery.data?.countries : []} />
          </GridItem>
          <GridItem colStart={2} colEnd={4}>
          <Features />
          </GridItem>
          <GridItem colSpan={1}>
            <TopCitizens citizens={citizenQuery.data ? citizenQuery?.data?.citizens : []} />
          </GridItem>
        </Grid>
      </div>
      <div className='flex md:hidden flex-col justify-center items-center gap-4 mt-6 px-8 w-full'>
        <Features />
        <TopCountries countries={(!countryQuery.data || countryQuery.error) ? [] : countryQuery?.data?.countries} />      
        <TopCitizens citizens={(!citizenQuery.data || citizenQuery.error) ? [] : citizenQuery?.data?.citizens} />
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ctx => {
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
    props: {},
  };
}
