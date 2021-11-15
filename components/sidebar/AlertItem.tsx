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

interface IAlertItem {
  alert: IAlert,
  index: number,
}

const AlertItem: React.FC<IAlertItem> = ({ alert, index }) => {
  const cookies = parseCookies();
  const toast = useToast();
  const router = useRouter();

  const { show } = useContextMenu({ id: `alert-${index}` });

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
    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload: { action: UserActions.ACCEPT_FR, data: { alert_index: index } },
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', 'Sent Request', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Request Not Sent', data?.error);
      }
    });
  }

  // TODO: Implement
  const declineFR = () => {}

  const readAlert = () => {
    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload: { action: 'read_alert', data: { alert_id: alert.id } },
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', 'Alert Marked as Read', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Error', data?.error);
      }
    })
  }

  const deleteAlert = () => {
    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload: { action: 'delete_alert', data: { alert_id: alert.id } },
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', 'Alert Deleted', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Error', data?.error);
      }
    });
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