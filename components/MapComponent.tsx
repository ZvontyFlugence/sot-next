import { MAP_STYLE } from "@/util/constants";
import { GMap } from "primereact/gmap";

interface IMapComponent {
  overlays: google.maps.Polygon[],
  minHeight?: String,
  onMapReady?: (e: any) => void,
}

const options = {
  center: {
    lat: 37.72886323155891,
    lng: -97.86977002071538,
  },
  zoom: 4,
  disableDefaultUI: true,
  styles: MAP_STYLE
};

const MapComponent: React.FC<IMapComponent> = ({ overlays, minHeight, onMapReady }) => {
  return (
    <GMap
      overlays={overlays}
      options={options}
      style={{ width: '100%', minHeight: minHeight ?? '500px' }}
      onMapReady={onMapReady}
    />
  );
}

export default MapComponent;