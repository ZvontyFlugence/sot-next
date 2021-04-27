import Layout from "@/components/Layout";
import AlertItem from "@/components/sidebar/AlertItem";
import { IUser } from "@/models/User";
import { getCurrentUser } from "@/util/auth";
import { Button } from "@chakra-ui/button";
import { destroyCookie } from "nookies";

interface IAlerts {
  user: IUser,
  isAuthenticated: boolean,
}

const Alerts: React.FC<IAlerts> = ({ user, ...props }) => {
  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl font-semibold pl-4'>My Alerts</h1>
      <div className='flex justify-end'>
        <Button variant='solid' colorScheme='blue'>Mark All as Read</Button>
        <Button variant='solid' colorScheme='red'>Delete All</Button>
      </div>
      {user.alerts.length > 0 ? (
        <div className='mt-4 mx-12 bg-white shadow-md rounded-lg border border-solid border-black border-opacity-25'>
          {user.alerts.map((alert, i) => (
            <AlertItem key={i} alert={alert} index={i} />
          ))}
        </div>
      ) : (
        <p>You do not have any alerts</p>
      )}
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
  let { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    res.writeHead(302, {
      Location: '/login',
    });
    res.end();
    return { props: {} };
  }

  return {
    props: { ...result },
  }
}

export default Alerts;