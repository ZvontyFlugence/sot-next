import { IAlert } from '@/models/User';
import { UserActions } from '@/util/actions';
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
          <div className='flex justify-end gap-4'>
            <IconButton
              as={IoCheckmarkOutline}
              variant='solid'
              colorScheme='green'
              onClick={acceptFR}
              aria-label='Accept Friend Request Button'
            />
            <IconButton
              as={IoCloseOutline}
              variant='solid'
              colorScheme='red'
              onClick={declineFR}
              aria-label='Declne Friend Request Button'
            />
          </div>
        );
      }
      default:
        return <></>;
    }
  };

  const acceptFR = () => {}

  const declineFR = () => {}

  const readAlert = () => {}

  const deleteAlert = () => {}

  return (
    <>
      <div className='flex py-2 px-4 alert-item border-b border-solid border-black border-opacity-25' onContextMenu={show}>
        { getActions() }
        <div className='flex justify-start gap-4 py-1 cursor-pointer'>
          <div className='px-4'>{getTimestamp()}</div>
          <div style={{ fontWeight: !alert.read ? 'lighter' : 'bold'}}>{alert.message}</div>
        </div>
      </div>

      <Menu id={`alert-${index}`}>
        <Item onClick={readAlert}>
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