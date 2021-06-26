import { IParty } from "@/models/Party";
import { IUser } from "@/models/User";
import { request } from "@/util/ui";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import { parseCookies } from "nookies";
import { useState } from "react";
import { useQuery } from "react-query";
import Select from "../Select";
import ManageCPCandidates from "./management/ManageCPCandidates";
import ManagePartyMembers from "./management/ManagePartyMembers";
import PartySettings from "./management/PartySettings";
import { IMemberInfo } from './PartyBody';

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

  const { isLoading, data, error } = useQuery('getPartyMembers', async () => {
    let members: IMemberInfo[] = [];

    for (let memberId of party.members) {
      const { user: member }: { user: IUser } = await request({
        url: `/api/users/${memberId}`,
        method: 'GET',
        token: cookies.token,
      });

      let role: string = 'Member';

      if (party.president === member._id)
        role = 'Party President';
      else if (party.vp === member._id)
        role = 'Vice Party President';

      members.push({
        id: member._id,
        name: member.username,
        image: member.image,
        role,
      } as IMemberInfo);
    }

    return { members };
  });

  const TABS: ITabs = {
    'Members': <ManagePartyMembers user_id={user_id} party_id={party._id} members={data?.members} />,
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
              {!isLoading && !error && (
                <ManagePartyMembers user_id={user_id} party_id={party._id} members={data?.members} />
              )}
            </TabPanel>
            <TabPanel>

            </TabPanel>
            <TabPanel>

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