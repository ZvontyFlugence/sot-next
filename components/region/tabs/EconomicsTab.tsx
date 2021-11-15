import { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";

interface IRegionEconomics {
    user: IUser;
    isAuthenticated: boolean;
    region: IRegion;
    population: number;
}

const RegionEconomicsTab: React.FC<IRegionEconomics> = ({ region, population, ...props }) => {
    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2>Region Economics</h2>
        </div>
    );
}

export default RegionEconomicsTab;