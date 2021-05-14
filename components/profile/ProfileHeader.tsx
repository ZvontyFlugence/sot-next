import { IUser } from "@/models/User";
import { UserActions } from "@/util/actions";
import { ILocationInfo } from "@/util/apiHelpers";
import { refreshData, request, showToast } from "@/util/ui";
import { IconButton } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { SettingsIcon } from "@chakra-ui/icons";
import { Image } from "@chakra-ui/image";
import { VStack } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { AiOutlineDollar, AiOutlineUsergroupAdd, AiOutlineUsergroupDelete } from 'react-icons/ai';
import { IoGiftOutline, IoMailOutline } from 'react-icons/io5';
import { useMutation } from "react-query";
import DonateModal from "./DonateModal";
import GiftModal from "./GiftModal";

interface IProfileHeader {
  user: IUser,
  profile: IUser,
  locationInfo: ILocationInfo,
}

const ProfileHeader: React.FC<IProfileHeader> = ({ user, profile, locationInfo }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const { isOpen: isSendMsgOpen, onOpen: onOpenSendMsg, onClose: onCloseSendMsg } = useDisclosure();
  const { isOpen: isDonateOpen, onOpen: onOpenDonate, onClose: onCloseDonate } = useDisclosure();
  const { isOpen: isGiftOpen, onOpen: onOpenGift, onClose: onCloseGift } = useDisclosure();

  const addMutation = useMutation(async () => {
    let payload = { action: UserActions.SEND_FR, data: { profile_id: profile._id } };
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
      showToast(toast, 'success', 'Friend Request Sent', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Failed to Send', e.message);
    }
  });

  const removeMutation = useMutation(async () => {
    let payload = {
      action: UserActions.REMOVE_FRIEND,
      data: { profile_id: profile._id },
    };

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
      showToast(toast, 'success', 'Friend Removed', data?.message);
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Failed Remove Friend', e.message);
    },
  });

  const addFriend = () => {
    addMutation.mutate();
  }

  const removeFriend = () => {
    removeMutation.mutate();
  }

  return (
    <div className='bg-night text-white p-4 shadow-md rounded'>
      <div className='flex flex-row items-stretch gap-4'>
        <Image boxSize='12.0rem' borderRadius="full" src={profile.image} alt={profile.username} />
        <div className='flex flex-col w-full items-top'>
          <h3 className='flex gap-4 text-2xl text-accent font-semibold'>
            {profile.username}
            <i className={`flag-icon flag-icon-${locationInfo.owner_flag}`} />
          </h3>
          <p className='flex flex-row items-center mt-4'>
            <span className='mr-2'>Location:</span>
            <span className='cursor-pointer mr-2' onClick={() => router.push(`/region/${profile.location}`)}>
              {locationInfo.region_name},
            </span>
            <span className='cursor-pointer' onClick={() => router.push(`/country/${locationInfo.owner_id}`)}>
              {locationInfo.owner_name}
              <i className={`ml-2 flag-icon flag-icon-${locationInfo.owner_flag}`} />
            </span>
          </p>
          <p className='flex flex-row items-center mt-4 gap-6'>
            <span>Level: {profile.level}</span>
            <span>Experience: {profile.xp}</span>
          </p>
          <p className='flex flex-col mt-4'>
            <span>Description:</span>
            <span className='border border-solid border-white border-opacity-25 p-2 w-full rounded-md'>
              <i>{profile.description}</i>
            </span>
          </p>
        </div>
        <div className='flex flex-col justify-self-start self-start'>
          {user._id === profile._id ? (
            <IconButton
              aria-label='Account Settings'
              variant='outline'
              color='whiteAlpha.700'
              colorScheme='whiteAlpha'
              title='Account Settings'
              icon={<SettingsIcon />}
              disabled={user._id !== profile._id}
              onClick={() => router.push('/settings')}
            />
          ) : (
            <VStack spacing={2} align='top'>
              {!user.friends.includes(profile._id) ? (
                <IconButton
                  aria-label='Add Friend'
                  variant='outline'
                  color='accent-alt'
                  colorScheme=''
                  title='Add Friend'
                  icon={<AiOutlineUsergroupAdd />}
                  disabled={user.pendingFriends.includes(profile._id)}
                  onClick={addFriend}
                />
              ) : (
                <IconButton
                  aria-label='Remove Friend'
                  variant='outline'
                  color='accent'
                  colorScheme=''
                  title='Remove Friend'
                  icon={<AiOutlineUsergroupDelete />}
                  onClick={removeFriend}
                />
              )}
              <IconButton
                aria-label='Send Message'
                variant='outline'
                color='accent-alt'
                colorScheme=''
                title='Send Message'
                icon={<IoMailOutline />}
                onClick={onOpenSendMsg}
              />
              <IconButton
                aria-label='Donate Money'
                variant='outline'
                color='accent-alt'
                colorScheme=''
                title='Donate Money'
                icon={<AiOutlineDollar />}
                onClick={onOpenDonate}
              />
              <IconButton
                aria-label='Gift Items'
                variant='outline'
                color='accent-alt'
                colorScheme=''
                title='Gift Items'
                icon={<IoGiftOutline />}
                onClick={onOpenGift}
              />
            </VStack>
          )}
        </div>
      </div>
      <DonateModal user={user} profile={profile} isOpen={isDonateOpen} onClose={onCloseDonate} />
      <GiftModal user={user} profile={profile} isOpen={isGiftOpen} onClose={onCloseGift} />
    </div>
  );
}

export default ProfileHeader;