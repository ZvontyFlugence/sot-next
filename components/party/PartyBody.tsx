import { ICandidate } from "@/models/Election";
import { IParty } from "@/models/Party";
import { Avatar } from "@chakra-ui/avatar";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import CongressCandidates from "./CongressCandidates";
import CPCandidates from "./CPCandidates";
import PartyMembers from "./PartyMembers";

interface IPartyBodyProps {
  party: IParty,
  user_id: number,
}

const PartyBody: React.FC<IPartyBodyProps> = ({ party, user_id }) => {
  return (
    <div className='w-full'>
      <div className='hidden md:block'>
        <Tabs className='flex items-start gap-4' orientation='vertical' isLazy>
          <TabList className='bg-night rounded shadow-md text-white'>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Members</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Party Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Congress Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Country Elections</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <PartyMembers party={party} />
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

              </div>
            </TabPanel>
            <TabPanel>
              <CongressCandidates user_id={user_id} party={party} />
            </TabPanel>
            <TabPanel>
              <CPCandidates user_id={user_id} party={party} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
      <div className='block md:hidden'>
        <Tabs className='flex flex-col gap-2' orientation='horizontal' isLazy>
          <TabList className='bg-night rounded shadow-md text-sm text-white overflow-x-auto overflow-y-hidden'>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Members</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Party Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Congress Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Country Elections</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <PartyMembers party={party} />
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

              </div>
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-4 bg-night shadow-md rounded px-4 py-2'>

              </div>
            </TabPanel>
            <TabPanel>
              <CPCandidates user_id={user_id} party={party} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}

export default PartyBody;