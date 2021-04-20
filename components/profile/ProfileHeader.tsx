import { IUser } from "@/models/User";
import { ILocationInfo } from "@/util/apiHelpers";
import { IconButton } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { SettingsIcon } from "@chakra-ui/icons";
import { Image } from "@chakra-ui/image";
import { VStack } from "@chakra-ui/layout";
import { useRouter } from "next/router";
import { AiOutlineDollar, AiOutlineUsergroupAdd, AiOutlineUsergroupDelete } from 'react-icons/ai';
import { IoGiftOutline, IoMailOutline } from 'react-icons/io5';

interface IProfileHeader {
  user: IUser,
  profile: IUser,
  locationInfo: ILocationInfo,
}

const ProfileHeader: React.FC<IProfileHeader> = ({ user, profile, locationInfo }) => {
  const router = useRouter();
  const { isOpen: isSendMsgOpen, onOpen: onOpenSendMsg, onClose: onCloseSendMsg } = useDisclosure();
  const { isOpen: isDonateOpen, onOpen: onOpenDonate, onClose: onCloseDonate } = useDisclosure();
  const { isOpen: isGiftOpen, onOpen: onOpenGift, onClose: onCloseGift } = useDisclosure();

  // TODO: Mutations for Add/Remove Friend

  return (
    <div className='bg-white p-4 shadow-md rounded-lg border border-solid border-black border-opacity-25'>
      <div className='flex flex-row items-stretch gap-4'>
        <Image boxSize='12.0rem' borderRadius="full" src={profile.image} alt={profile.username} />
        <div className='flex flex-col w-full items-top'>
          <h3 className='flex gap-4 text-xl font-semibold'>
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
            <span className='border border-solid border-black border-opacity-25 p-2 w-full rounded-md'>
              <i>{profile.description}</i>
            </span>
          </p>
        </div>
        <div className='flex flex-col justify-self-start self-start'>
          {user._id === profile._id ? (
            <IconButton
              aria-label='Account Settings'
              icon={<SettingsIcon />}
              disabled={user._id !== profile._id}
              onClick={() => {}}
            />
          ) : (
            <VStack spacing={2} align='top'>
              {!user.friends.includes(profile._id) ? (
                <IconButton
                  aria-label='Add Friend'
                  title='Add Friend'
                  icon={<AiOutlineUsergroupAdd />}
                  disabled={user.pendingFriends.includes(profile._id)}
                  onClick={() => {}}
                />
              ) : (
                <IconButton
                  aria-label='Remove Friend'
                  title='Remove Friend'
                  icon={<AiOutlineUsergroupDelete />}
                  onClick={() => {}}
                />
              )}
              <IconButton
                aria-label='Send Message'
                title='Send Message'
                icon={<IoMailOutline />}
                onClick={onOpenSendMsg}
              />
              <IconButton
                aria-label='Donate Money'
                title='Donate Money'
                icon={<AiOutlineDollar />}
                onClick={onOpenDonate}
              />
              <IconButton
                aria-label='Gift Items'
                title='Gift Items'
                icon={<IoGiftOutline />}
                onClick={onOpenGift}
              />
            </VStack>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;