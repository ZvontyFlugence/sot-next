import { IRegion } from "@/models/Region";

interface IRegionPolitics {
    region: IRegion;
}

const RegionPoliticsTab: React.FC<IRegionPolitics> = ({ region }) => {
    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2>Region Politics</h2>
        </div>
    );
}

export default RegionPoliticsTab;