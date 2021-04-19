import { IItem } from '@/util/apiHelpers';
import { ITEMS } from '@/util/constants';

interface IInventory {
  inventory: IItem[],
}

interface IInventoryItem {
  item: IItem,
}

const Inventory: React.FC<IInventory> = ({ inventory }) => {
  return !inventory || inventory.length === 0 ? (
    <p className='w-full'>There are no items in inventory</p>
  ) : (
    <div className='grid grid-cols-3 md:grid-cols-5 border border-1 border-solid border-opacity-50'>
      {inventory.map((item: IItem, i: number) => (
        <InventoryItem key={i} item={item} />
      ))}
    </div>
  );
}

const InventoryItem: React.FC<IInventoryItem> = ({ item }) => {
  const itemInfo = ITEMS[item.item_id];

  return (
    <div className='relative w-full h-24 border border-1 border-black border-opacity-25 shadow-md'>
      <div className='absolute top-0 right-0 h-6 w-auto'>
        <span>{item.quantity}</span>
      </div>
      <i className={itemInfo.image} />
      <p>{itemInfo.quality > 0 && `Q${itemInfo.quality}`} {itemInfo.name}</p>
    </div>
  );
}

export default Inventory;