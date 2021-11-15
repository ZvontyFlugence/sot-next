import { RESOURCES } from '@/util/constants';
import { request } from '@/util/ui';
import { Badge, List, ListItem } from '@chakra-ui/layout';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect } from 'react';
import useSWR from 'swr';

interface ICountryRegions {
  country_id: number,
  capital: number,
}

export const getCountryRegionsFetcher = (url: string, token: string) => request({ url, method: 'GET', token });

const Regions: React.FC<ICountryRegions> = ({ country_id, capital }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const { id } = router.query;

  const query = useSWR([`/api/countries/${country_id}/regions`, cookies.token], getCountryRegionsFetcher);

  useEffect(() => {
    query.mutate();
  }, [id]);

  const getResourceColor = (resource_id: number) => {
    switch ((resource_id - 1) % 3) {
      case 0:
        return 'red';
      case 1:
        return 'yellow';
      case 2:
        return 'green';
      default:
        return;
    }
  }

  const getResourceName = (resource_id: number) => {
    let resource = RESOURCES[Math.floor((resource_id - 1) / 3)];
    return resource?.name || 'None';
  }

  return (
    <div>
      <h2 className='text-xl text-accent'>Regions</h2>
      {!query.error && query.data && (
        <List className='mt-4 px-8 w-full'>
          {query.data?.regions.sort((a, b) => {
            if (a.name < b.name)
              return -1;
            else if (a.name > b.name)
              return 1;
            else
              return 0;
          }).map((region, i) => (
            <ListItem key={i} className='flex justify-between items-center'>
              <p>{region.name}</p>
              <div className='flex gap-2'>
                {region._id === capital && (
                  <Badge colorScheme='blue'>Capital</Badge>
                )}
                {region.resource > 0 ? (
                  <Badge colorScheme={getResourceColor(region.resource)}>
                    {getResourceName(region.resource)}
                  </Badge> 
                ) : (
                  <Badge>None</Badge>
                )}
              </div>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
}

export default Regions;