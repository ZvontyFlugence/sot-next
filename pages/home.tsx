import { parseCookies, destroyCookie } from 'nookies';
import Layout from '@/components/Layout';
import { getCurrentUser } from '@/util/auth';
import { Grid, GridItem } from '@chakra-ui/layout';
import Card from '@/components/Card';
import { Button } from '@chakra-ui/button';
import { useToast } from '@chakra-ui/toast';
import { refreshData, request, showToast } from '@/util/ui';
import { useRouter } from 'next/router';
import Inventory from '@/components/shared/Inventory';
import Company, { ICompany } from '@/models/Company';
import { jsonify, roundMoney } from '@/util/apiHelpers';
import { Avatar } from '@chakra-ui/avatar';
import { COMPANY_TYPES } from '@/util/constants';
import { GetServerSideProps } from 'next';
import useSWR, { useSWRConfig } from 'swr';
import { getWalletInfoFetcher } from '@/components/Sidebar';
import { useUser } from '@/context/UserContext';

interface IHomeProps {
  job: ICompany,
}

export default function Home({ job }: IHomeProps) {
  const toast = useToast();
  const router = useRouter();
  const cookies = parseCookies();
  const user = useUser();
  const { mutate } = useSWRConfig();
  const { data: walletInfo } = useSWR(['/api/me/wallet-info', cookies.token], getWalletInfoFetcher);

  const hasTrained = new Date(user.canTrain) > new Date(Date.now());
  const hasWorked = new Date(user.canWork) > new Date(Date.now());

  const handleTrain = () => {
    if (!hasTrained) {
      request({
        url: '/api/me/doAction',
        method: 'POST',
        payload: { action: 'train' },
        token: cookies.token,
      }).then(data => {
        if (data.success) {
          showToast(toast, 'success', 'Training Complete', data?.message);
          refreshData(router);
          mutate('/api/me');
        } else {
          showToast(toast, 'error', 'Training Failed', data?.error);
        }
      })
    } else {
      showToast(toast, 'error', 'Already Trained Today', 'You can only train once per day');
    }
  }

  const handleWork = () => {
    if (!hasWorked) {
      // Make Local SWR Cache Update
      mutate(
        '/api/me/wallet-info',
        {
          ...walletInfo,
          [user.country]: {
            ...walletInfo[user.country],
            amount: roundMoney(walletInfo?.walletInfo[user.country]?.amount + job.employees.find(emp => emp.user_id === user._id)?.wage),
          }
        },
        false
      );
      
      // Send POST Request
      request({
        url: '/api/me/doAction',
        method: 'POST',
        payload: { action: 'work' },
        token: cookies.token,
      }).then(data => {
        if (data.success) {
          showToast(toast, 'success', 'Working Complete', data?.message);
          refreshData(router);
          // Revalidate Wallet Info
          mutate('/api/me/wallet-info');
          // Revalidate User Stats
          mutate('/api/me');
        } else {
          showToast(toast, 'error', 'Working Failed', data?.error);
        }
      })
    } else {
      showToast(toast, 'error', 'Already Worked Today', 'You can only work once per day');
    }
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl pl-4 font-semibold text-accent'>My Home</h1>
      <div className='hidden md:block'>
        <Grid className='mt-8 pl-8 pr-24' templateColumns='repeat(5, 1fr)' gap={12}>
          <GridItem colSpan={2}>
            <Card>
              <Card.Header className='text-xl font-semibold text-white h-brand'>Gym</Card.Header>
              <Card.Content className='text-white'>
                <p>Current Strength: {user.strength}</p>
                <Button
                  className='mt-2'
                  variant='solid'
                  colorScheme='blue'
                  isDisabled={hasTrained || user.health < 10}
                  onClick={handleTrain}
                >
                  Train
                </Button>
              </Card.Content>
            </Card>
          </GridItem>
          <GridItem colStart={3} colEnd={6}>
            <Card>
              <Card.Header className='text-xl font-semibold text-white h-brand'>Work</Card.Header>
              <Card.Content className='text-white'>
                {job ? (
                  <div className='flex justify-between items-center mt-2'>
                    <div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/company/${job._id}`)}>
                      <Avatar src={job.image} name={job.name} />
                      {job.name}
                      <i className={COMPANY_TYPES[job.type].css} title={COMPANY_TYPES[job.type].text} />
                    </div>
                    <Button
                      variant='solid'
                      colorScheme='blue'
                      isDisabled={hasWorked || user.health < 10}
                      onClick={handleWork}
                    >
                      Work
                    </Button>
                  </div>
                ): (
                  <div className='flex flex-col justify-center items-center'>
                    <p>You do not have a job</p>
                    <Button
                      className='mt-2'
                      variant='solid'
                      colorScheme='green'
                      onClick={() => router.push('/markets/job')}
                    >
                      Find Job
                    </Button>
                  </div>
                )}
              </Card.Content>
            </Card>
          </GridItem>
          <GridItem colSpan={5}>
            <Card>
              <Card.Header className='text-xl font-semibold text-white h-brand'>Inventory</Card.Header>
              <Card.Content className='text-white'>
                <Inventory inventory={user.inventory} displayOnly />
              </Card.Content>
            </Card>
          </GridItem>
        </Grid>
      </div>
      <div className='flex md:hidden flex-col gap-4 mt-2 px-4'>
        <Card>
          <Card.Header className='text-xl font-semibold text-white h-brand'>Gym</Card.Header>
          <Card.Content className='text-white'>
            <p>Current Strength: {user.strength}</p>
            <Button
              className='mt-2'
              variant='solid'
              colorScheme='blue'
              isDisabled={hasTrained || user.health < 10}
              onClick={handleTrain}
            >
              Train
            </Button>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header className='text-xl font-semibold text-white h-brand'>Work</Card.Header>
          <Card.Content className='text-white'>
            {job ? (
              <div className='flex justify-between items-center mt-2'>
                <div className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/company/${job._id}`)}>
                  <Avatar src={job.image} name={job.name} />
                  {job.name}
                  <i className={COMPANY_TYPES[job.type].css} title={COMPANY_TYPES[job.type].text} />
                </div>
                <Button
                  variant='solid'
                  colorScheme='blue'
                  isDisabled={hasWorked || user.health < 10}
                  onClick={handleWork}
                >
                  Work
                </Button>
              </div>
            ): (
              <div className='flex flex-col justify-center items-center'>
                <p>You do not have a job</p>
                <Button
                  className='mt-2'
                  variant='solid'
                  colorScheme='green'
                  onClick={() => router.push('/markets/job')}
                >
                  Find Job
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>
        <Card>
          <Card.Header className='text-xl font-semibold text-white h-brand'>Inventory</Card.Header>
          <Card.Content className='text-white'>
            <Inventory inventory={user.inventory} displayOnly />
          </Card.Content>
        </Card>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const { req } = ctx;

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

  let job: ICompany;

  if (result.user?.job) {
    job = await Company.findOne({ _id: result.user.job }).exec();
  }

  return {
    props: { job: (job && jsonify(job)) || null },
  };
}