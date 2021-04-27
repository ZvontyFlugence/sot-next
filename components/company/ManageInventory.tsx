import { IItem } from "@/util/apiHelpers";
import { Button } from "@chakra-ui/button";
import Inventory from "../shared/Inventory";

interface IManageInventory {
  inventory: IItem[],
}

const ManageInventory: React.FC<IManageInventory> = ({ inventory }) => {
  return (
    <>
      <div className='flex justify-end gap-4 mb-2'>
        <Button size='sm' variant='solid' colorScheme='green'>Deposit</Button>
        <Button size='sm' variant='solid' colorScheme='red'>Withdraw</Button>
      </div>
      <Inventory inventory={inventory} />
    </>
  );
}

export default ManageInventory;