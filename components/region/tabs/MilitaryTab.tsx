import { IRegion } from "@/models/Region";

interface IRegionMilitary {
    region: IRegion;
}

const RegionMilitaryTab: React.FC<IRegionMilitary> = ({ region }) => {
    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2>Region Military</h2>
        </div>
    );
}

export default RegionMilitaryTab;