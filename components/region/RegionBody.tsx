import { useSelectedTab } from "@/context/RegionPageContext";
import { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";
import RegionEconomicsTab from "./tabs/EconomicsTab";
import RegionMilitaryTab from "./tabs/MilitaryTab";
import RegionPoliticsTab from "./tabs/PoliticalTab";
import RegionInfoTab from "./tabs/RegionInfoTab";

interface IRegionBody {
    user: IUser;
    isAuthenticated: boolean;
    region: IRegion;
    population: number;
}

const RegionBody: React.FC<IRegionBody> = (props: IRegionBody) => {
    const selectedTab = useSelectedTab();

    switch (selectedTab) {
        case 1:
            return <RegionEconomicsTab {...props} />
        case 2:
            return <RegionPoliticsTab {...props} />
        case 3:
            return <RegionMilitaryTab {...props} />
        case 0:
        default:
            return <RegionInfoTab {...props} />
    }
}

export default RegionBody;