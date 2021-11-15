import { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";

interface IRegionMilitary {
    user: IUser;
    isAuthenticated: boolean;
    region: IRegion;
    population: number;
}

const RegionMilitaryTab: React.FC<IRegionMilitary> = ({ region, population, ...props }) => {
    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2>Region Military</h2>
        </div>
    );
}

export default RegionMilitaryTab;