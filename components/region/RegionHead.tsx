/*global google*/
import { ICountry } from '@/models/Country';
import { IPath, IRegion } from '@/models/Region';
import { IUser } from '@/models/User';
import { RESOURCES } from '@/util/constants';
import { request } from '@/util/ui';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import React, { useEffect, useState } from 'react';
import MapComponent from '../MapComponent';
import Select from '../Select';

interface IRegionHead {
    user: IUser;
    isAuthenticated: boolean;
    region: IRegion;
}

const RegionHead: React.FC<IRegionHead> = ({ user, region, ...props }) => {
    const cookies = parseCookies();
    const router = useRouter();

    const [regions, setRegions] = useState<IRegion[]>([]);
    const [owners, setOwners] = useState<ICountry[]>([]); 
    const [overlays, setOverlays] = useState([]);
    const [mapRef, setMapRef] = useState<google.maps.Map>(null);

    useEffect(() => {
        request({
            url: '/api/regions',
            method: 'GET',
            token: cookies.token,
        }).then(data => {
            if (data.regions)
                setRegions(data.regions);
        });

        request({
            url: '/api/countries',
            method: 'GET',
            token: cookies.token,
        }).then(data => {
            if (data.countries)
                setOwners(data.countries);
        });
    }, []);

    useEffect(() => {
        if (region) {
            let paths: IPath[] | IPath[][] = [];

            if (region.type === 'single') {
                paths = (region.borders as IPath[]).map((path: IPath) => ({ lat: path.lng, lng: path.lat }));
            } else if (region.type === 'multi') {
                paths = (region.borders as IPath[][]).map((geom: IPath[]) => {
                    return geom.map((path: IPath) => ({ lat: path.lng, lng: path.lat }));
                });
            }

            let bounds = new google.maps.LatLngBounds();
            paths.map((path: IPath | IPath[]) => {
                if ((path as IPath).lng)
                    bounds.extend(path as IPath);
                else
                    (path as IPath[]).map((innerPath: IPath) => bounds.extend(innerPath));
            });

            mapRef?.setCenter(bounds.getCenter());

            let polygon: google.maps.Polygon = new google.maps.Polygon({
                paths,
                strokeWeight: 1,
                fillColor: '#777777',
                fillOpacity: 0.9
            });

            setOverlays([polygon]);
        }
    }, [region]);

    const onMapReady = (e: any) => {
        setMapRef(e.map as google.maps.Map);
    }

    const getResourceInfo = () => {
        const resourceId = Math.floor(region.resource / 3);
        const resourceLevelId = region.resource % 3;
        if (resourceId < 0)
            return 'None';

        const resource = RESOURCES[resourceId];
        let resourceLevel = 'Low';

        switch (resourceLevelId) {
            case 1:
                resourceLevel = 'Medium';
                break;
            case 2:
                resourceLevel = 'High';
                break;
            case 0:
            default:
                resourceLevel = 'Low';
                break;
        } 

        return resource ? (
            <span>
                {resourceLevel} {resource.name} <i className={`ml-2 ${resource.css}`} />
            </span>
        ) : 'None';
    }

    const goToRegion = (value: string | number) => {
        if (value && value != region._id)
            router.push(`/region/${value}`);
    }

    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <div className='flex flex-row justify-between items-start gap-4'>
                <div className='flex flex-grow-0' style={{ width: '200px', minHeight: '200px' }}>
                    {overlays && (
                        <MapComponent
                            overlays={overlays}
                            minHeight={'100%'}
                            onMapReady={onMapReady}
                        />
                    )}
                </div>
                <div className='flex flex-col flex-grow'>
                    <h1 className='text-2xl'>
                        { region.name }
                        <i className={`ml-2 flag-icon flag-icon-${owners[region.owner - 1]?.flag_code}`} />
                    </h1>
                    <div className='flex flex-row items-center gap-2'>
                        <p>
                            Owner: 
                            <span className='ml-2 link' onClick={() => router.push(`/country/${region.owner}`)}>
                                {owners[region.owner - 1]?.name}
                                <i className={`ml-2 flag-icon flag-icon-${owners[region.owner - 1]?.flag_code}`} />
                            </span>
                        </p>
                        <p>
                            Core:
                            <span className='ml-2 link' onClick={() => router.push(`/country/${region.core}`)}>
                                {owners[region.core - 1]?.name}
                                <i className={`ml-2 flag-icon flag-icon-${owners[region.core - 1]?.flag_code}`} />
                            </span>
                        </p>
                    </div>
                    <span>
                        Resource: {getResourceInfo()}
                    </span>
                </div>
                <Select className='border border-white border-opacity-25 rounded' selected={region._id || 1} onChange={val => goToRegion(val)}>
                    {regions.map((r, i) => (
                        <Select.Option key={i} value={r._id}>
                            <i className={`mr-2 flag-icon flag-icon-${owners[r.owner - 1]?.flag_code} rounded shadow-md`} />
                            {r.name}
                        </Select.Option>
                    ))}
                </Select>
            </div>
        </div>
    );
}

export default RegionHead;