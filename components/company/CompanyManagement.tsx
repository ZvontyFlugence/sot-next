import { ICompany } from "@/models/Company";
import { ILocationInfo } from "@/util/apiHelpers";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import ManageEmployees from "./ManageEmployees";
import ManageJobOffers from "./ManageJobOffers";
import ManageProductOffers from "./ManageProductOffers";
import ManageTreasury from "./ManageTreasury";

interface ICompManagement {
  company: ICompany,
  currency: string,
  locationInfo: ILocationInfo,
}

const CompanyManagement: React.FC<ICompManagement> = ({ company, currency, locationInfo }) => {
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
              <ManageProductOffers productOffers={company.productOffers} company_id={company._id} currency={currency} />
            </TabPanel>
            <TabPanel>
              <ManageJobOffers jobOffers={company.jobOffers} company_id={company._id} currency={currency} />
            </TabPanel>
            <TabPanel>
              <ManageEmployees company_id={company._id} employees={company.employees} currency={currency} />
            </TabPanel>
            <TabPanel>

            </TabPanel>
            <TabPanel>
              <ManageTreasury
                company_id={company._id}
                funds={company.funds}
                gold={company.gold}
                currency={currency}
                locationInfo={locationInfo}
              />
            </TabPanel>
          </TabPanels>
        </div>
      </Tabs>   
    </div>
  );
}

export default CompanyManagement;