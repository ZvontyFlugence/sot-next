import { IRegion } from "@/models/Region";
import { IUser } from "@/models/User";

interface IRegionEconomics {
    region: IRegion;
}

const RegionEconomicsTab: React.FC<IRegionEconomics> = ({ region }) => {
    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2>Region Economics</h2>
        </div>
    );
}

export default RegionEconomicsTab;