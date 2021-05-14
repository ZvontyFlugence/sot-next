import { ICompany } from "@/models/Company";
import { IUser } from "@/models/User";
import { ILocationInfo } from "@/util/apiHelpers";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import Inventory from "../shared/Inventory";
import CompanySettings from "./CompanySettings";
import ManageEmployees from "./ManageEmployees";
import ManageInventory from "./ManageInventory";
import ManageJobOffers from "./ManageJobOffers";
import ManageProductOffers from "./ManageProductOffers";
import ManageTreasury from "./ManageTreasury";

interface ICompManagement {
  company: ICompany,
  currency: string,
  locationInfo: ILocationInfo,
  user: IUser,
}

const CompanyManagement: React.FC<ICompManagement> = ({ company, currency, locationInfo, user }) => {
  return (
    <div className='w-full'>
      <Tabs variant='enclosed'>
        <div className='bg-night text-white rounded shadow-md'>
          <TabList borderColor='accent-alt'>
            <Tab _selected={{ color: 'accent' }}>Product Offers</Tab>
            <Tab _selected={{ color: 'accent' }}>Job Offers</Tab>
            <Tab _selected={{ color: 'accent' }}>Employees</Tab>
            <Tab _selected={{ color: 'accent' }}>Inventory</Tab>
            <Tab _selected={{ color: 'accent' }}>Treasury</Tab>
            <Tab _selected={{ color: 'accent' }}>Settings</Tab>
          </TabList>
        </div>
        <div className='bg-night text-white mt-4 rounded shadow-md'>
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
              <ManageInventory inventory={company.inventory} company_id={company._id} currency={currency} />
            </TabPanel>
            <TabPanel>
              <ManageTreasury
                company_id={company._id}
                funds={company.funds}
                gold={company.gold}
                currency={currency}
                locationInfo={locationInfo}
                user={user}
              />
            </TabPanel>
            <TabPanel>
              <CompanySettings company={company} />
            </TabPanel>
          </TabPanels>
        </div>
      </Tabs>   
    </div>
  );
}

export default CompanyManagement;