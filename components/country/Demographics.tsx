import { ICountry } from "@/models/Country";
import { request } from "@/util/ui";
import { List, ListItem } from "@chakra-ui/layout";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useEffect } from "react";
import { useQuery } from "react-query";

interface IDemographics {
  country: ICountry;
}

const Demographics: React.FC<IDemographics> = ({ country }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const { id } = router.query;

  const query = useQuery('getDemographics', () => {
    return request({
      url: `/api/countries/${country._id}/demographics`,
      method: 'GET',
      token: cookies.token,
    });
  });

  useEffect(() => {
    query.refetch();
  }, [id]);

  return (
    <div className='w-full'>
      <h2 className='text-xl text-accent'>Demographics</h2>
      {query.isSuccess && query.data && (
        <List className='mt-4 px-8 w-full' spacing={3}>
          <ListItem className='flex justify-between items-center'>
            <h3>Population</h3>
            <p>{query.data?.population}</p>
          </ListItem>
          <ListItem className='flex justify-between items-center'>
            <h3>New Citizens Today</h3>
            {query.data?.newCitizens}
          </ListItem>
          <ListItem className='flex justify-between items-center'>
            <h3>Average Citizen Level</h3>
            {query.data?.averageLevel}
          </ListItem>
        </List>
      )}
    </div>
  );
}

export default Demographics;