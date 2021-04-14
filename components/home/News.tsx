import { IUser } from "@/models/User";
import Card from "../Card";

interface INews {
  user: IUser,
}

const News: React.FC<INews> = ({ user }) => {
  return (
    <div className='mt-8 px-12'>
      <Card>
        <Card.Header className='text-xl font-semibold'>News</Card.Header>
        <Card.Content>News Body</Card.Content>
      </Card>
    </div>
  );
}

export default News;