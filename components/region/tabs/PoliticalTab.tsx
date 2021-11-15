import { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";

interface IRegionPolitics {
    user: IUser;
    isAuthenticated: boolean;
    region: IRegion;
    population: number;
}

const RegionPoliticsTab: React.FC<IRegionPolitics> = ({ region, population, ...props }) => {
    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2>Region Politics</h2>
        </div>
    );
}

export default RegionPoliticsTab;