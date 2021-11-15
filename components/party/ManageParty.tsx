import { IParty } from "@/models/Party";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { parseCookies } from "nookies";
import { useState } from "react";
import Select from "../Select";
import ManageCongressCandidates from "./management/ManageCongressCandidates";
import ManageCPCandidates from "./management/ManageCPCandidates";
import ManagePartyMembers from "./management/ManagePartyMembers";
import PartySettings from "./management/PartySettings";
import { getPartyMembersFetcher } from './PartyMembers';
import useSWR from 'swr';

interface IManagePartyProps {
  user_id: number,
  party: IParty,
}

interface ITabs {
  [key: string]: React.ReactNode,
}

const ManageParty: React.FC<IManagePartyProps> = ({ user_id, party }) => {
  const cookies = parseCookies();
  const [tab, setTab] = useState<string>('Members');

  const { data, error } = useSWR(['getPartyMembers', cookies.token, party], getPartyMembersFetcher);

  const TABS: ITabs = {
    'Members': <ManagePartyMembers user_id={user_id} party_id={party._id} members={data?.members} />,
    'Congress Elections': <ManageCongressCandidates user_id={user_id} party={party} />,
    'Country Elections': <ManageCPCandidates partyId={party._id} candidates={party.cpCandidates} country={party.country} />,
    'Settings':  <PartySettings user_id={user_id} party={party} />,
  }

  return (
    <div className='w-full'>
      <div className="hidden md:block">
        <Tabs className='flex items-start gap-4' orientation='vertical'>
          <TabList className='bg-night rounded shadow-md text-white'>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Members</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Party Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Congress Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Country Elections</Tab>
            <Tab className='h-brand font-semibold' _selected={{ color: 'accent-alt', borderColor: 'accent-alt' }}>Settings</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {data && !error && (
                <ManagePartyMembers user_id={user_id} party_id={party._id} members={data?.members} />
              )}
            </TabPanel>
            <TabPanel>

            </TabPanel>
            <TabPanel>
              <ManageCongressCandidates user_id={user_id} party={party} />
            </TabPanel>
            <TabPanel>
              <ManageCPCandidates partyId={party._id} candidates={party.cpCandidates} country={party.country} />
            </TabPanel>
            <TabPanel>
              <PartySettings user_id={user_id} party={party} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
      <div className="block md:hidden">
        <div className='flex flex-col gap-2'>
          <Select onChange={tab => setTab(tab as string)}>
              {Object.keys(TABS).map((key: string, i: number) => (
                <Select.Option key={i} value={key}>
                  {key}
                </Select.Option>
              ))}
          </Select>
          <div>
            {TABS[tab]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageParty;