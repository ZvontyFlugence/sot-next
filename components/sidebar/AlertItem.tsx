import { IAlert } from '@/models/User';
import { UserActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { IconButton } from '@chakra-ui/button';
import { useToast } from '@chakra-ui/toast';
import { formatDistance } from 'date-fns';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { Menu, Item, useContextMenu } from 'react-contexify';
import { IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { useMutation } from 'react-query';

interface IAlertItem {
  alert: IAlert,
  index: number,
}

const AlertItem: React.FC<IAlertItem> = ({ alert, index }) => {
  const cookies = parseCookies();
  const toast = useToast();
  const router = useRouter();

  const { show } = useContextMenu({ id: `alert-${index}` });

  // Mutations
  const readMutation = useMutation(async () => {
    let payload = { action: 'read_alert', data: { alert_index: index } };
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
      showToast(toast, 'success', 'Alert Marked as Read', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Error', e.message);
    }
  });

  const deleteMutation = useMutation(async () => {
    let payload = { action: 'delete_alert', data: { alert_index: index } };
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
      showToast(toast, 'success', 'Alert Deleted', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Error', e.message);
    }
  });

  const acceptMutation = useMutation(async () => {
    let payload = { action: UserActions.ACCEPT_FR, data: { alert_index: index } };
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
      showToast(toast, 'success', 'Sent Request', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Request Not Sent', e.message);
    }
  });

  const getTimestamp = () => (
    <span>{ formatDistance(new Date(alert.timestamp), new Date(Date.now()), { addSuffix: true }) }</span>
  );

  const getActions = () => {
    switch (alert.type) {
      case UserActions.SEND_FR: {
        return (
          <div className='flex w-full'>
            <div className='flex justify-end gap-4 w-full'>
              <IconButton
                as={IoCheckmarkOutline}
                size='sm'
                variant='solid'
                colorScheme='green'
                onClick={acceptFR}
                aria-label='Accept Friend Request Button'
              />
              <IconButton
                as={IoCloseOutline}
                size='sm'
                variant='solid'
                colorScheme='red'
                onClick={declineFR}
                aria-label='Declne Friend Request Button'
              />
            </div>
          </div>
        );
      }
      default:
        return <></>;
    }
  };

  const acceptFR = () => {
    acceptMutation.mutate();
  }

  const declineFR = () => {}

  const readAlert = () => {
    readMutation.mutate();
  }

  const deleteAlert = () => {
    deleteMutation.mutate();
  }

  return (
    <>
      <div className={`flex py-2 px-4 alert-item border-b border-solid border-black border-opacity-25 ${alert.read ? 'bg-gray-500 bg-opacity-25' : ''}`} onContextMenu={show}>
        <div className={`flex justify-start gap-4 py-1 cursor-pointer w-full ${alert.read ? 'text-white' : 'text-accent-alt'}`}>
          <div className='px-4'>{getTimestamp()}</div>
          <div style={{ fontWeight: alert.read ? 'lighter' : 'bold'}}>{alert.message}</div>
        </div>
        { !alert.read && getActions() }
      </div>

      <Menu id={`alert-${index}`} theme='brand'>
        <Item onClick={readAlert} disabled={alert.read}>
          Mark as Read
        </Item>
        <Item onClick={deleteAlert}>
          Delete
        </Item>
      </Menu>
    </>
  );
}

export default AlertItem;