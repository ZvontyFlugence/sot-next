import { IItem } from '@/util/apiHelpers';
import { ITEMS } from '@/util/constants';
import { Item, Menu, useContextMenu } from 'react-contexify';

interface IInventory {
  inventory: IItem[],
  onSellItem?: () => void,
  setSelected?: React.Dispatch<React.SetStateAction<IItem>>,
}

interface IInventoryItem {
  item: IItem,
  index: number,
  onSellItem?: () => void,
}

const Inventory: React.FC<IInventory> = ({ inventory, ...props }) => {

  const handleSellItem = (item: IItem) => {
    props.setSelected(item);
    props.onSellItem();
  }

  return !inventory || inventory.length === 0 ? (
    <p className='w-full'>There are no items in inventory</p>
  ) : (
    <div className='grid grid-cols-3 md:grid-cols-8 rounded p-4'>
      {inventory.map((item: IItem, i: number) => (
        <InventoryItem key={i} item={item} index={i} onSellItem={() => handleSellItem(item)} />
      ))}
    </div>
  );
}

const InventoryItem: React.FC<IInventoryItem> = ({ item, index, ...props }) => {
  const itemInfo = ITEMS[item.item_id];
  const { show } = useContextMenu({ id: `item-${index}` });

  return (
    <>
      <div className='relative w-full h-20 rounded border border-accent-alt shadow-md cursor-pointer' onContextMenu={show}>
        <div className='absolute -top-px right-0 h-6 px-1 pb-1 w-auto bg-accent-alt text-white rounded-tr border boder-solid border-blue-500'>
          <span>{item.quantity}</span>
        </div>
        <div className='flex flex-col items-center justify-center mt-1'>
          <i className={itemInfo.image} style={{ zoom: itemInfo.quality > 0 ? '150%' : '175%' }} />
          <p>{itemInfo.quality > 0 && `Q${itemInfo.quality}`} {itemInfo.name}</p>
        </div>
      </div>

      <Menu id={`item-${index}`} theme='brand'>
        <Item onClick={props.onSellItem}>
          Sell Item
        </Item>
        <Item>
          Withdraw Item
        </Item>
      </Menu>
    </>
  );
}

export default Inventory;