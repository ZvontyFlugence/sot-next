import { RESOURCES } from '@/util/constants';
import { request } from '@/util/ui';
import { Badge, List, ListItem } from '@chakra-ui/layout';
import { Button, ButtonGroup, IconButton } from '@chakra-ui/button';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';
import { IoCaretBack, IoCaretForward } from 'react-icons/io5';
import useSWR from 'swr';
import Select from '../Select';

interface ICountryRegions {
  country_id: number,
  capital: number,
}

export const getCountryRegionsFetcher = (url: string, token: string) => request({ url, method: 'GET', token });

const Regions: React.FC<ICountryRegions> = ({ country_id, capital }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const { id } = router.query;

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

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

  const getPageDetails = (): { start: number, end: number } => {
    if (query.data?.regions.length <= pageSize)
      return { start: 0, end: query.data?.regions.length };
    else if (query.data?.regions.length <= ((page + 1) * pageSize))
      return { start: (page * pageSize), end: query.data?.regions.length };

    return { start: (page * pageSize), end: ((page + 1) * pageSize) };
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
          }).slice(...Object.values(getPageDetails())).map((region, i) => (
            <ListItem key={i} className='flex justify-between items-center'>
              <p className='link' onClick={() => router.push(`/region/${region._id}`)}>{region.name}</p>
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
      <div className='flex justify-center items-center gap-8 my-4'>
          <ButtonGroup isAttached variant='outline'>
            <IconButton
              aria-label='Previous Page'
              icon={<IoCaretBack />}
              onClick={() => setPage(curr => curr - 1)}
              disabled={page === 0}
            />
            <Button _hover={{ bg: 'initial', cursor: 'default' }}>{page + 1}</Button>
            <IconButton
              aria-label='Next Page'
              icon={<IoCaretForward />}
              onClick={() => setPage(curr => curr + 1)}
              disabled={((page + 1) * pageSize) >= query.data?.regions.length}
            />
          </ButtonGroup>
          <Select className='border border-white border-opacity-25 rounded shadow-md' selected={pageSize} onChange={(value) => setPageSize(value as number)}>
            {[3, 5, 10, 15, 25, 50].map((num: number, i: number) => (
              <Select.Option key={i} value={num}>{num}</Select.Option>
            ))}
          </Select>
        </div>
    </div>
  );
}

export default Regions;