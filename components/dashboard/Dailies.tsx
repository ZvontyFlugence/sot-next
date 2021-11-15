import { IUser } from "@/models/User";
import { refreshData, request, showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { Checkbox } from "@chakra-ui/checkbox";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import Card from "../Card";

interface IDailies {
  user: IUser,
}

const Dailies: React.FC<IDailies> = ({ user }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const hasTrained = new Date(user.canTrain) > new Date(Date.now());
  const hasWorked = new Date(user.canWork) > new Date(Date.now());
  const hasCollectedRewards = new Date(user.canCollectRewards) > new Date(Date.now());

  const handleClick = () => {
    if (hasTrained && hasWorked && !hasCollectedRewards) {
      // Collect Rewards
      request({
        url: '/api/me/doAction',
        method: 'POST',
        payload: { action: 'collect_rewards' },
        token: cookies.token,
      }).then(data => {
        if (data.success) {
          showToast(toast, 'success', 'Collected Rewards', data?.message);
          refreshData(router);
        } else {
          showToast(toast, 'error', 'Failed to Collect Rewards', data?.error);
        }
      });
    } else if (!hasTrained || !hasWorked) {
      // Route to My Home
      router.push('/home');
    }
  }

  return (
    <div className='mt-4 px-8 md:px-24'>
      <Card>
        <Card.Header className='text-xl font-semibold text-white h-brand'>Daily Tasks</Card.Header>
        <Card.Content className='text-white'>
          <div className='flex flex-row justify-between items-center mt-2 w-full'>
            <div className='flex flex-col'>
              <Checkbox size='sm' isChecked={hasTrained} isReadOnly>Train</Checkbox>
              <Checkbox size='sm' isChecked={hasWorked} isReadOnly>Work</Checkbox>
            </div>
            <div className='flex justify-start w-1/2'>
              <Button
                variant='solid'
                colorScheme={hasTrained && hasWorked ? 'blue' : 'green'}
                isDisabled={hasCollectedRewards}
                onClick={handleClick}
              >
                {hasTrained && hasWorked ? 'Collect Rewards' : 'Go To Task'}
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default Dailies;