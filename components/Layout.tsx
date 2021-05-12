import { IUser } from "@/models/User";
import { Grid, GridItem } from "@chakra-ui/layout";
import Nav from "./Nav";
import Sidebar from "./Sidebar";

interface ILayout {
  user: IUser
}

const Layout: React.FC<ILayout> = ({ user, children }) => {
  return (
    <div className='h-screen w-full overflow-hidden'>
      <Nav user={user} />
      <div className='flex h-full overflow-y-auto'>
        <div className='w-1/5 mx-8 my-8'>
          <Sidebar user={user} />
        </div>
        <div className='w-4/5 mt-8'>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;