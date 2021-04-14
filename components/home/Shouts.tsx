import { IUser } from "@/models/User";
import { Button } from "@chakra-ui/button";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { Textarea } from "@chakra-ui/textarea";
import Card from "../Card";

interface IShouts {
  user: IUser,
}

const Shouts: React.FC<IShouts> = ({ user }) => {
  return (
    <div className='mt-4 px-12'>
      <Tabs variant='enclosed' isLazy>
        <div className='p-1 bg-white rounded-lg shadow-md border border-solid border-black border-opacity-25'>
          <TabList>
            <Tab>Global</Tab>
            <Tab>Country</Tab>
            <Tab isDisabled>Party</Tab>
            <Tab isDisabled>Unit</Tab>
          </TabList>
        </div>        
        <div className='mt-2 bg-white rounded-lg shadow-md border border-solid border-black border-opacity-25'>
          <div className='p-4'>
            <p className='text-sm font-semibold'>Shout</p>
            <Textarea size='sm' resize='none' placeholder='Enter shout message' />
            <Button variant='solid' colorScheme='blue'>Shout</Button>
          </div>
          <hr />
          <TabPanels>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
          </TabPanels>
        </div>
      </Tabs>
    </div>
  )
}

export default Shouts;