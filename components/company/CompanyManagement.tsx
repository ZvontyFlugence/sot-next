import { ICompany } from "@/models/Company";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import ManageJobOffers from "./ManageJobOffers";
import ManageProductOffers from "./ManageProductOffers";

interface ICompManagement {
  company: ICompany,
  currency: string,
}

const CompanyManagement: React.FC<ICompManagement> = ({ company, currency }) => {
  return (
    <div className='w-full'>
      <Tabs variant='enclosed'>
        <div className='bg-white rounded-lg shadow-md border border-solid border-black border-opacity-25'>
          <TabList>
            <Tab>Product Offers</Tab>
            <Tab>Job Offers</Tab>
            <Tab>Employees</Tab>
            <Tab>Inventory</Tab>
            <Tab>Treasury</Tab>
          </TabList>
        </div>
        <div className='bg-white mt-4 rounded-lg shadow-md border border-solid border-black border-opacity-25'>
          <TabPanels>
            <TabPanel>
              <ManageProductOffers productOffers={company.productOffers} />
            </TabPanel>
            <TabPanel>
              <ManageJobOffers jobOffers={company.jobOffers} company_id={company._id} currency={currency} />
            </TabPanel>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
          </TabPanels>
        </div>
      </Tabs>   
    </div>
  );
}

export default CompanyManagement;