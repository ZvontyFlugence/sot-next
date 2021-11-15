import { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";

interface IRegionInfoProps {
    user: IUser;
    isAuthenticated: boolean;
    region: IRegion;
    population: number;
}

const RegionInfoTab: React.FC<IRegionInfoProps> = ({ region, population, ...props }) => {
    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2>Region Info</h2>
        </div>
    );
}

export default RegionInfoTab;