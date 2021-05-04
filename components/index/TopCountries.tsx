import { ICountryStats } from "@/models/Country";
import { List, ListItem } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import Card from "../Card";

export default function TopCountries({ countries }: { countries: ICountryStats[] }) {
  return (
    <Card>
      <Card.Header className='text-xl text-center font-bold text-white h-brand'>Top Countries</Card.Header>
      <Card.Content>
        {!countries ? (
          <Spinner color='red.500' size='xl' />
        ) : (
          <List>
            {countries && countries.map((c: ICountryStats) => {
              return (
                <ListItem key={c._id} className='flex justify-between mt-4 text-white'>
                  <div className='flex justify-start items-center'>
                    <span className={`flag-icon flag-icon-${c.flag_code} text-3xl`}></span>
                    <span className='ml-4'>{ c.name }</span>
                  </div>
                  <div className='flex justify-end'>
                    <span className=''>{ c.population || 0 }</span>
                  </div>
                </ListItem>
              );
            })}
          </List>
        )}
      </Card.Content>
    </Card>
  );
}