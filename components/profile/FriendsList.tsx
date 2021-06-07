import { Avatar } from "@chakra-ui/avatar";
import { useRouter } from "next/router";

interface IFriendsList {
  friends: IFriendListItem[]
}

export interface IFriendListItem {
  id: number,
  username: string,
  image: string,
}

const FriendsList: React.FC<IFriendsList> = ({ friends }) => {
  const router = useRouter();
  
  return (
    <div className='grid grid-cols-1 md:grid-cols-5 p-4'>
      {friends && friends.map((friend, i) => (
        <div key={i} className='flex flex-col items-center cursor-pointer rounded shadow border border-white border-opacity-25 p-2' onClick={() => router.push(`/profile/${friend.id}`)}>
          <Avatar boxSize='3.0rem' src={friend.image} alt={friend.username} />
          <span className='text-accent-alt font-semibold text-center'>{friend.username}</span>
        </div>
      ))}
    </div>
  );
}

export default FriendsList;