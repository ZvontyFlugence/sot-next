import { IUser } from "@/models/User";
import { parseCookies, destroyCookie } from 'nookies';
import Layout from "@/components/Layout";
import { getCurrentUser } from "@/util/auth";
import { Grid, GridItem } from "@chakra-ui/layout";
import Card from "@/components/Card";
import { Button } from "@chakra-ui/button";
import { useMutation } from 'react-query';
import { useToast } from "@chakra-ui/toast";
import { refreshData } from "@/util/ui";
import { useRouter } from "next/router";

interface IHomeProps {
  user: IUser,
  isAuthenticated: boolean,
}

export default function Home({ user, ...props }: IHomeProps) {
  const toast = useToast();
  const router = useRouter();
  const cookies = parseCookies();
  const hasTrained = new Date(user.canTrain) > new Date(Date.now());

  const mutation = useMutation(() => {
    let payload = { action: 'train' };
    return fetch('/api/me/doAction', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${cookies.token}`,
      },
      body: JSON.stringify(payload),
    }).then(res => res.json());
  }, {
    onSuccess: (data) => {
      if (data.success) {
        toast({
          position: 'top-right',
          title: 'Training Complete',
          description: data.message,
          status: 'success',
          duration: 2500,
          isClosable: true,
        });
        refreshData(router);
      } else {
        toast({
          position: 'top-right',
          title: 'Training Failed',
          description: data.error,
          status: 'error',
          duration: 2500,
          isClosable: true,
        });
      }
    },
    onError: (e) => {
      toast({
        position: 'top-right',
        title: 'Training Failed',
        description: e,
        status: 'error',
        duration: 2500,
        isClosable: true,
      });
    },
  });

  const handleTrain = () => {
    if (!hasTrained) {
      // Call training endpoint via useMutation
      mutation.mutate();
    }
    return;
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl pl-4 font-semibold'>My Home</h1>
      <Grid className='mt-8 pl-8 pr-24' templateColumns='repeat(5, 1fr)' gap={12}>
        <GridItem colSpan={2}>
          <Card>
            <Card.Header className='text-xl font-semibold'>Gym</Card.Header>
            <Card.Content>
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
            <Card.Header className='text-xl font-semibold'>Work</Card.Header>
            <Card.Content></Card.Content>
          </Card>
        </GridItem>
        <GridItem colSpan={5}>
          <Card>
            <Card.Header className='text-xl font-semibold'>Inventory</Card.Header>
            <Card.Content></Card.Content>
          </Card>
        </GridItem>
      </Grid>
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
  const { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    res.writeHead(302, {
      Location: '/login',
    });
    res.end();
    return;
  }

  return {
    props: { ...result }
  };
}