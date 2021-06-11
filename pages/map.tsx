/*global google*/
import { IUser } from "@/models/User";
import { getCurrentUser } from "@/util/auth";
import { destroyCookie } from "nookies";
import { useEffect, useState } from "react";
import { RESOURCES } from '@/util/constants';
import { Button } from "@chakra-ui/button";
import Region, { IRegion, IPath } from "@/models/Region";
import { useToast } from "@chakra-ui/toast";
import Country, { ICountry } from "@/models/Country";
import { useRouter } from "next/router";
import { pSBC } from "@/util/ui";
import { jsonify } from "@/util/apiHelpers";
import Nav from "@/components/Nav";
import MapComponent from "@/components/MapComponent";

interface IMap {
  user: IUser,
  isAuthenticated: boolean,
  regions: IRegion[],
  owners: ICountry[],
}

const Map: React.FC<IMap> = ({ user, regions, owners, ...props }) => {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState('political');
  const [overlays, setOverlays] = useState([]);
  const [mapReady, setMapReady] = useState(false);

  const getResource = (value: number): React.ReactNode => {
    let resource_id = Math.floor((value - 1) / 3);
    let resource = RESOURCES[resource_id];
    let quality = '';

    switch ((value - 1) % 3) {
      case 0:
        quality = 'Low';
        break;
      case 1:
        quality = 'Medium';
        break;
      case 2:
        quality = 'High';
        break;
      default:
        quality = '';
        break;
    }

    if (value > 0 && resource.css) {
      return (
        <span className='flex justify-end'>
          {quality} {resource.name}
          <i className={`ml-2 align-middle ${resource.css}`} title={resource.name} />
        </span>
      );
    } else {
      return <span className='flex justify-end'>None</span>;
    }
  }

  const getResourceColor = (resource: number): string => {
    switch (resource) {
      case 1:
      case 2:
      case 3:
        return '#ffd500'; // Wheat
      case 4:
      case 5:
      case 6:
        return '#d6d6d6'; // Iron
      case 7:
      case 8:
      case 9:
        return '#4d4c4c'; // Oil
      case 10:
      case 11:
      case 12:
        return '#bbeb1e'; // Uranium
      case 13:
      case 14:
      case 15:
        return '#a2bfdb'; // Aluminum
      case 16:
      case 17:
      case 18:
        return '#81888f'; // Steel
      default:
        return '#ffffff'; // None
    }
  }

  const displayRegionInfo = (region: IRegion) => {
    toast({
      position: 'top-right',
      status: 'info',
      title: (
        <span>
          {region.name}
          &nbsp;
          <i className={`flag-icon flag-icon-${owners[region.owner-1].flag_code}`} />
        </span>
      ),
      description: (
        <div className='mx-auto'>
          <p className='flex justify-between'>
            <span>Core:</span>
            <span>
              {owners[region.owner-1].nick}
              &nbsp;
              <i className={`flag-icon flag-icon-${owners[region.owner-1].flag_code}`} />
            </span>
          </p>
          <p className='flex justify-between'>
            <span>Resource:</span>
            <span>{getResource(region.resource)}</span>
          </p>
        </div>
      ),
      isClosable: false,
    });
  }

  const getRegionColor = (region: IRegion) => {
    switch (mode) {
      case 'resources': {
        return getResourceColor(region.resource);
      }
      case 'political':
      default: {
        return owners[region.owner-1].color;
      }
    }
  }

  useEffect(() => {
    if (mode) {
      setOverlays(regions.map(region => {
        let paths: IPath[] | IPath[][] = [];
        if (!region?.type) {
          paths = (region.borders as IPath[]).map((path: IPath) => ({ lat: path.lng, lng: path.lat }));
        } else {
          paths = (region.borders as IPath[][]).map((geom: IPath[]) => {
            return geom.map((path: IPath) => ({ lat: path.lng, lng: path.lat }));
          });
        }

        const color: string = getRegionColor(region);
        let polygon: google.maps.Polygon = new google.maps.Polygon({ paths, strokeWeight: 1, fillColor: color, fillOpacity: 0.9 });
        polygon.addListener('click', () => router.push(`/region/${region._id}`));
        polygon.addListener('mouseover', () => {
          displayRegionInfo(region);

          // Highlight
          polygon.setOptions({ fillColor: pSBC(0.3, color) });
        });
        polygon.addListener('mouseout', () => {
          toast.closeAll();
          polygon.setOptions({ fillColor: color });
        });
        return polygon;
      }));
    }
  }, [mode]);

  return (
    <>
      <Nav user={user} />
      <div className='mt-8'>
        <h1 className='text-2xl text-accent pl-4 font-semibold'>World Map</h1>
        <div className='flex justify-end gap-2 mr-8'>
          <Button size='sm' variant='solid' colorScheme='blue' onClick={() => setMode('political')}>Political</Button>
          <Button size='sm' variant='solid' colorScheme='green' onClick={() => setMode('resources')}>Resources</Button>
        </div>
        <div className='mt-4 mr-8'>
          {overlays && (
            <MapComponent overlays={overlays} />
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async ctx => {
  const { req } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let regions: IRegion[] = await Region.find({}).exec();
  let owners: ICountry[] = await Country.find({}).exec();

  return {
    props: { ...result, regions: jsonify(regions), owners: jsonify(owners) },
  };
}

export default Map;