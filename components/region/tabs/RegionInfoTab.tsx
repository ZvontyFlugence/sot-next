import { ICountry } from '@/models/Country';
import { IRegion } from '@/models/Region';
import { request } from '@/util/ui';
import { List, ListItem } from '@chakra-ui/layout';
import { Spinner } from '@chakra-ui/spinner';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface IRegionInfoProps {
    region: IRegion;
}

export const getRegionPopulationFetcher = (url: string, token: string) => request({ url, method: 'GET', token });
export const getRegionNeighborsFetcher = (url: string, token: string) => request({ url, method: 'GET', token });

const RegionInfoTab: React.FC<IRegionInfoProps> = ({ region }) => {
    const cookies = parseCookies();
    const router = useRouter();

    const [countries, setCountries] = useState<ICountry[]>([]);

    const populationQuery = useSWR([`/api/regions/${region._id}/population`, cookies.token], getRegionPopulationFetcher);
    const neighborsQuery = useSWR([`/api/regions/${region._id}/neighbors`, cookies.token], getRegionNeighborsFetcher);

    useEffect(() => {
        request({
            url: '/api/countries',
            method: 'GET',
        }).then(data => {
            if (data?.countries)
                setCountries(data.countries);
        })
    }, []);

    return (
        <div className='bg-night text-white p-4 shadow-md rounded'>
            <h2 className='text-xl'>Region Info</h2>
            <div className='mt-4 px-8 w-full'>
                {populationQuery.error && (
                    <p>An error has occurred</p>
                )}
                {!populationQuery.data && !populationQuery.error && (
                    <div className='flex justify-center'>
                        <Spinner color='accent' size='xl' />
                    </div>
                )}
                {populationQuery.data && (
                    <List spacing={3}>
                        <h3 className='text-lg text-bold text-accent'>Population</h3>
                        <ListItem className='flex justify-between items-center pl-4'>
                            <p>Residents</p>
                            <p>{populationQuery.data?.population} residents</p>
                        </ListItem>
                        <ListItem className='flex justify-between items-center pl-4'>
                            <p>Citizens</p>
                            <p>{populationQuery.data?.citizens} citizens</p>
                        </ListItem>
                    </List>
                )}
            </div>
            <div className='mt-4 px-8 w-full'>
                {neighborsQuery.error && (
                    <p>An error has occurred</p>
                )}
                {!neighborsQuery.data && !neighborsQuery.error && (
                    <div className='flex justify-center'>
                        <Spinner color='accent' size='xl' />
                    </div>
                )}
                {neighborsQuery.data && (
                    <List spacing={3}>
                        <h3 className='text-lg text-bold text-accent'>Neighbors</h3>
                        {(neighborsQuery.data?.neighbors as IRegion[]).map((neighbor: IRegion) => (
                            <ListItem key={neighbor._id} className='flex justify-between items-center pl-4'>
                                <span className='link' onClick={() => router.push(`/region/${neighbor._id}`)}>{neighbor.name}</span>
                                <span className='link' onClick={() => router.push(`/country/${neighbor.owner}`)}>
                                    {countries[neighbor.owner - 1]?.name}
                                    <i className={`ml-2 sot-flag sot-flag-${countries[neighbor.owner - 1]?.flag_code}`} />
                                </span>
                            </ListItem>
                        ))}
                    </List>
                )}
            </div>
        </div>
    );
}

export default RegionInfoTab;