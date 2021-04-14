import { IUser } from "@/models/User";
import { Grid, GridItem } from "@chakra-ui/layout";
import Nav from "./Nav";
import Sidebar from "./Sidebar";

interface ILayout {
  user: IUser
}

const Layout: React.FC<ILayout> = ({ user, children }) => {
  return (
    <div className='h-full w-full overflow-hidden'>
      <Nav user={user} />
      <Grid templateColumns='repeat(5, 1fr)' spacing={48}>
        <GridItem className='mx-8 my-8' colSpan={1}>
          <Sidebar user={user} />
        </GridItem>
        <GridItem className='mt-8' colSpan={4}>
          {children}
        </GridItem>
      </Grid>
    </div>
  );
}

export default Layout;