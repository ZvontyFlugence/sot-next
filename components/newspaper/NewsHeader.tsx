import { INewspaper } from "@/models/Newspaper";
import { IUser } from "@/models/User";
import { ICEOInfo } from "@/util/apiHelpers";
import { Avatar } from "@chakra-ui/avatar";
import { IconButton } from "@chakra-ui/button";
import { EditIcon } from "@chakra-ui/icons";
import { Image } from "@chakra-ui/image";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/stat";
import { Tag } from "@chakra-ui/tag";
import { useRouter } from "next/router";

interface INewsHeader {
  newspaper: INewspaper,
  authorInfo: ICEOInfo,
  userId: number,
  onManage: () => void,
}

const NewsHeader: React.FC<INewsHeader> = ({ newspaper, authorInfo, onManage, ...props }) => {
  const router = useRouter();

  return (
    <>
      <div className='hidden md:block p-4 w-full bg-night text-white rounded shadow-md'>
        <div className='flex flex-row items-stretch gap-4'>
          <Image boxSize='12.0rem' src={newspaper.image} alt='' />
          <div className='flex flex-col w-full items-start'>
            <h3 className='text-xl font-semibold text-accent'>{newspaper.name}</h3>
            <p className='flex items-center mt-2'>
              Author:
              <Tag className='flex gap-2 ml-2 cursor-pointer' bgColor='transparent' onClick={() => router.push(`/profile/${authorInfo.ceo_id}`)}>
                <Avatar boxSize='2.0rem' src={authorInfo.ceo_image} name={authorInfo.ceo_name} />
                <span className='text-white'>{ authorInfo.ceo_name }</span>
              </Tag>
            </p>
            <div className='mt-2'>
              <Stat>
                <StatLabel>Subscribers</StatLabel>
                <StatNumber>{newspaper.subscribers}</StatNumber>
              </Stat>
            </div>
          </div>
          <div className='flex flex-col justify-self-start self-start'>
            <IconButton
              aria-label='Manage Newspaper Button'
              variant='outline'
              colorScheme=''
              icon={<EditIcon />}
              disabled={props.userId !== newspaper.author}
              onClick={onManage}
            />
          </div>
        </div>
      </div>
      <div className="block md:hidden bg-night text-white p-4 shadow-md rounded w-full">
        <div className="flex flex-col items-stretch gap-2 w-full">
          <div className="flex justify-between items-center gap-2 w-full">
            <div className="flex gap-2 items-center flex-grow">
              <Image boxSize='3.5rem' src={newspaper.image} alt='' />
              <h3 className='text-xl font-semibold text-accent'>{newspaper.name}</h3>
            </div>
            <IconButton
              aria-label='Manage Newspaper Button'
              variant='outline'
              size='sm'
              colorScheme=''
              icon={<EditIcon />}
              disabled={props.userId !== newspaper.author}
              onClick={onManage}
            />
          </div>
          <div className='text-base'>
            <div className='flex items-center'>
              Author:
              <Tag className='flex gap-2 ml-2 cursor-pointer' bgColor='transparent' onClick={() => router.push(`/profile/${authorInfo.ceo_id}`)}>
                <Avatar boxSize='2.0rem' src={authorInfo.ceo_image} name={authorInfo.ceo_name} />
                <span className='text-white'>{ authorInfo.ceo_name }</span>
              </Tag>
            </div>
            <div>
              <Stat>
                <StatLabel>Subscribers</StatLabel>
                <StatNumber>{newspaper.subscribers.length}</StatNumber>
              </Stat>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NewsHeader;