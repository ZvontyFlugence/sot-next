import { ICountry } from "@/models/Country";
import { IUser } from "@/models/User";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import React, { useState } from "react";
import Select from "../Select";
import Demographics from "./Demographics";
import Economy from "./Economy";
import Government from "./Government";
import LawsTab from "./Laws";
import Military from "./Military";
import Regions from "./Regions";

interface ICountryBody {
  country: ICountry,
  user: IUser,
}

const CountryBody: React.FC<ICountryBody> = ({ country, user }) => {
  const [selected, setSelected] = useState<string>('');

  const TABS = {
    'Demographics': <Demographics country={country} />,
    'Regions': <Regions country_id={country._id} capital={country.capital} />,
    'Government': <Government country={country} />,
    'Economy': <Economy country={country} />,
    'Military': <Military country={country} user={user} />,
    'Laws': <LawsTab country={country} user={user} />,
};

  return (
    <>
      <div className='hidden md:block w-full'>
        <Tabs className='w-full' orientation='vertical' isLazy>
          <div className='flex items-start gap-12 w-full'>
            <TabList className='flex flex-grow-0 bg-night text-white shadow-md rounded'>
              {Object.keys(TABS).map((tab: string, i: number) => (
                <Tab key={i} _hover={{ color: 'accent-alt' }} _selected={{ color: 'accent-alt' }} borderColor='accent-alt'>{tab}</Tab>
              ))}
            </TabList>
            <TabPanels className='flex-grow bg-night text-white shadow-md rounded w-full'>
              {Object.values(TABS).map((panelContent: React.ReactNode, i: number) => (
                <TabPanel className='w-full' key={i}>
                  {panelContent}
                </TabPanel>
              ))}
            </TabPanels>
          </div>
        </Tabs>
      </div>
      <div className="block md:hidden w-full">
        <div className='flex flex-col justify-center gap-4 w-full overflow-x-visible'>
          <Select onChange={(val) => setSelected(val as string)}>
            {Object.keys(TABS).map((tab: string, i: number) => (
              <Select.Option key={i} value={tab}>
                {tab}
              </Select.Option>
            ))}
          </Select>
          <div className='bg-night text-white shadow-md rounded p-4'>
            {TABS[selected]}
          </div>
        </div>
      </div>
    </>
  );
}

export default CountryBody;