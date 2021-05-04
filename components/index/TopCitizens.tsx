import { List, ListItem } from "@chakra-ui/layout";
import { Image } from "@chakra-ui/image";

import Card from "../Card";
import { IUserStats } from '@/models/User';
import { Spinner } from "@chakra-ui/spinner";

export default function TopCitizens({ citizens }: { citizens: IUserStats[] }) {
  return (
    <Card>
      <Card.Header className='text-xl text-center font-bold text-white h-brand'>Top Citizens</Card.Header>
      <Card.Content>
        {!citizens ? (
          <Spinner color='red.500' size='xl' />
        ) : (
          <List>            
            {citizens && citizens.map((c: IUserStats) => (
              <ListItem key={c.username} className='flex justify-between mt-4 text-white'>
                <div className='flex justify-start items-center'>
                  <Image boxSize='50px' src={c.image} alt={c.username} />
                  <span className='ml-4'>{ c.username }</span>
                </div>
                <div className='flex justify-end items-center'>
                  <span className={`flag-icon flag-icon-${c.country.flag_code} text-3xl`}></span>
                  <span className='ml-4'>{ c.xp } XP</span>
                </div>
              </ListItem>
            ))}
          </List>
        )}
      </Card.Content>
    </Card>
  );
}