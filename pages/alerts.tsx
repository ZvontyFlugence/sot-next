import Layout from "@/components/Layout";
import AlertItem from "@/components/sidebar/AlertItem";
import { IUser } from "@/models/User";
import { getCurrentUser } from "@/util/auth";
import { refreshData, request, showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from "nookies";
import { useMutation } from "react-query";

interface IAlerts {
  user: IUser,
  isAuthenticated: boolean,
}

const Alerts: React.FC<IAlerts> = ({ user, ...props }) => {
  const cookies = parseCookies();
  const toast = useToast();
  const router = useRouter();

  const readAllMutation = useMutation(async () => {
    let values = await Promise.all(user && user.alerts.filter(a => !a.read).map(async (alert, i) => {
      let payload = { action: 'read_alert', data: { alert_index: i } };
      return await request({
        url: '/api/me/doAction',
        method: 'POST',
        payload,
        token: cookies.token,
      });
    }));

    if (!values.every(res => res.success)) {
      let index = values.findIndex(res => !res.success && res?.error);
      throw new Error(index >= 0 ? values[index].error : 'Unknown Error');
    }
    return values[0];
  }, {
    onSuccess: (data) => {
      showToast(toast, 'success', 'All Alerts Marked as Read', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Error', e.message);
    }
  });

  const deleteAllMutation = useMutation(async () => {
    let values = await Promise.all(user && user.alerts.map(async (alert) => {
      let payload = { action: 'delete_alert', data: { alert_index: 0 } };
      return await request({
        url: '/api/me/doAction',
        method: 'POST',
        payload,
        token: cookies.token,
      });
    }));

    if (!values.every(res => res.success)) {
      let index = values.findIndex(res => !res.success && res?.error);
      throw new Error(index >= 0 ? values[index].error : 'Unknown Error');
    }
    return values[0];
  }, {
    onSuccess: (data)  => {
      showToast(toast, 'success', 'All Alerts Deleted', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Error', e.message);
    }
  });

  const handleReadAll = () => {
    readAllMutation.mutate();
  }

  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl font-semibold pl-4 text-accent'>My Alerts</h1>
      <div className='flex justify-end gap-4 pr-12'>
        <Button variant='solid' colorScheme='blue' onClick={handleReadAll}>Mark All as Read</Button>
        <Button variant='solid' colorScheme='red' onClick={handleDeleteAll}>Delete All</Button>
      </div>
      {user.alerts.length > 0 ? (
        <div className='mt-4 mx-12 bg-night shadow-md rounded'>
          {user.alerts.map((alert, i) => (
            <AlertItem key={i} alert={alert} index={i} />
          ))}
        </div>
      ) : (
        <p className='mt-4 mx-12 bg-night text-white shadow-md rounded py-2 px-4'>
          You do not have any alerts
        </p>
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