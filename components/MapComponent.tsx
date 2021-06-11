import { MAP_STYLE } from "@/util/constants";
import { GMap } from "primereact/gmap"

interface IMapComponent {
  overlays: any[],
}

const MapComponent: React.FC<IMapComponent> = ({ overlays }) => {
  const options = {
    center: {
      lat: 37.72886323155891,
      lng: -97.86977002071538,
    },
    zoom: 4,
    disableDefaultUI: true,
    styles: MAP_STYLE,
  };

  return (
    <GMap
      overlays={overlays}
      options={options}
      style={{ width: '100%', minHeight: '700px' }}
    />
  );
}

export default MapComponent;