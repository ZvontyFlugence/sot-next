import { ICountry } from "@/models/Country";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import Demographics from "./Demographics";
import Regions from "./Regions";

interface ICountryBody {
  country: ICountry,
}

const CountryBody: React.FC<ICountryBody> = ({ country }) => {
  return (
    <Tabs className='w-full' orientation='vertical' isLazy>
      <div className='flex justify-start items-start gap-12 w-full'>
        <TabList className='flex flex-grow-0 bg-night text-white shadow-md rounded'>
          <Tab _hover={{ color: 'accent-alt' }} _selected={{ color: 'accent-alt' }} borderColor='accent-alt'>Demographics</Tab>
          <Tab _hover={{ color: 'accent-alt' }} _selected={{ color: 'accent-alt' }} borderColor='accent-alt'>Regions</Tab>
          <Tab _hover={{ color: 'accent-alt' }} _selected={{ color: 'accent-alt' }} borderColor='accent-alt'>Government</Tab>
          <Tab _hover={{ color: 'accent-alt' }} _selected={{ color: 'accent-alt' }} borderColor='accent-alt'>Economy</Tab>
          <Tab _hover={{ color: 'accent-alt' }} _selected={{ color: 'accent-alt' }} borderColor='accent-alt'>Military</Tab>
          <Tab _hover={{ color: 'accent-alt' }} _selected={{ color: 'accent-alt' }} borderColor='accent-alt'>Laws</Tab>
        </TabList>
        <TabPanels className='flex flex-grow bg-night text-white shadow-md rounded'>
          <TabPanel className='w-full'>
            <Demographics country={country} />
          </TabPanel>
          <TabPanel className='w-full'>
            <Regions country_id={country._id} capital={country.capital} />
          </TabPanel>
          <TabPanel></TabPanel>
          <TabPanel></TabPanel>
          <TabPanel></TabPanel>
          <TabPanel></TabPanel>
        </TabPanels>
      </div>
    </Tabs>
  );
}

export default CountryBody;