import { List, ListItem } from '@chakra-ui/layout';

import Card from '@/components/Card';

export default function Features() {
  return (
    <Card>
      <Card.Header className='text-xl text-center font-bold mb-4'>Features</Card.Header>
      <Card.Content>
        <List spacing={3}>
          <ListItem>
            <p className='font-semibold'>Player-Ran Simulation</p>
            Everything in State of Turmoil is controlled by the players.
            Here, the players have all the power and control not only their own destinies but the fate of the world itself!
          </ListItem>
          <ListItem>
            <p className='font-semibold'>In-Depth Mechanics</p>
            State of Turmoil has a variety of unique mechanics and features to set it apart from similar games.
            We pride ourselves on our attention to detail and depth of our features to truly make a great simulation of the world.
          </ListItem>
          <ListItem>
            <p className='font-semibold'>Caters to all Gameplay Styles</p>
            Every player is a unique individual and has their own gameplay preferences and styles. So whether you want to be an author of a popular newspaper,
            a wealthy businessman, prominent politician, a patriotic soldier, or ruthless mercenary -- we have something for all players to enjoy!
          </ListItem>
        </List>
      </Card.Content>
    </Card>
  );
}