import { IUser } from "@/models/User";
import { parseCookies, destroyCookie } from 'nookies';
import Layout from "@/components/Layout";
import { getCurrentUser } from "@/util/auth";
import { Grid, GridItem } from "@chakra-ui/layout";
import Card from "@/components/Card";
import { Button } from "@chakra-ui/button";
import { useMutation, useQueryClient } from 'react-query';
import { useToast } from "@chakra-ui/toast";
import { refreshData, request, showToast } from "@/util/ui";
import { useRouter } from "next/router";
import Inventory from "@/components/shared/Inventory";
import Company, { ICompany } from "@/models/Company";
import { jsonify } from "@/util/apiHelpers";
import { Avatar } from "@chakra-ui/avatar";
import { COMPANY_TYPES } from "@/util/constants";

interface IHomeProps {
  user: IUser,
  isAuthenticated: boolean,
  job: ICompany,
}

export default function Home({ user, job, ...props }: IHomeProps) {
  const toast = useToast();
  const router = useRouter();
  const cookies = parseCookies();
  const queryClient = useQueryClient();
  const hasTrained = new Date(user.canTrain) > new Date(Date.now());
  const hasWorked = new Date(user.canWork) > new Date(Date.now());

  const trainMutation = useMutation(async () => {
    let payload = { action: 'train' };
    let data = await request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onSuccess: (data) => {
      showToast(toast, 'success', 'Training Complete', data.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Training Failed', e.message);
    },
  });

  const workMutation = useMutation(async () => {
    let payload = { action: 'work' };
    let data = await request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('getWalletInfo');
      showToast(toast, 'success', 'Working Complete', data.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Working Failed', e.message);
    },
  });

  // TODO: Show Error Toast if already worked
  const handleTrain = () => {
    if (!hasTrained) {
      trainMutation.mutate();
    } else {
      showToast(toast, 'error', 'Already Trained Today', 'You can only train once per day');
    }
  }

  const handleWork = () => {
    if (!hasWorked) {
      workMutation.mutate();
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

export const getServerSideProps = async ctx => {
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
    props: { ...result, job: (job && jsonify(job)) || null },
  };
}