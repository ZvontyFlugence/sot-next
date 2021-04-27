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
    <div className='grid grid-cols-3 md:grid-cols-8 rounded border border-black border-solid border-opacity-50 p-4'>
      {inventory.map((item: IItem, i: number) => (
        <InventoryItem key={i} item={item} />
      ))}
    </div>
  );
}

const InventoryItem: React.FC<IInventoryItem> = ({ item }) => {
  const itemInfo = ITEMS[item.item_id];

  return (
    <div className='relative w-full h-20 rounded border border-solid border-black border-opacity-25 shadow-md'>
      <div className='absolute -top-px right-0 h-6 px-1 pb-1 w-auto bg-blue-500 text-white rounded-tr border boder-solid border-blue-500'>
        <span>{item.quantity}</span>
      </div>
      <div className='flex flex-col items-center justify-center'>
        <i className={itemInfo.image} style={{ zoom: itemInfo.quality > 0 ? '150%' : '175%' }} />
        <p>{itemInfo.quality > 0 && `Q${itemInfo.quality}`} {itemInfo.name}</p>
      </div>
    </div>
  );
}

export default Inventory;