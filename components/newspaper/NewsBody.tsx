import { INewspaper } from "@/models/Newspaper";
import { IUser } from "@/models/User";

interface INewsBody {
  user: IUser,
  newspaper: INewspaper,
}

const NewsBody: React.FC<INewsBody> = ({ user, newspaper }) => {
  return (
    <></>
  );
}

export default NewsBody;