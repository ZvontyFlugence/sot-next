import { List, ListItem } from '@chakra-ui/layout';
import React from 'react';

interface IManageProductOffers {
  productOffers: Array<Object>,
}

const ManageProductOffers: React.FC<IManageProductOffers> = ({ productOffers }) => {
  return !productOffers || productOffers.length === 0 ? (
    <div>
      Company has no product offers
    </div>
  ) : (
    <div>
      <List>
        {productOffers.map((offer, i) => (
          <ListItem key={i}>
            Offer No. {i}
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default ManageProductOffers;