import { IFunds } from "@/models/Company";
import { ILocationInfo } from "@/util/apiHelpers";
import { Button } from "@chakra-ui/button";
import { Stat, StatGroup, StatLabel, StatNumber } from "@chakra-ui/stat";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";

interface IManageTreasury {
  company_id: number,
  funds: IFunds[],
  gold: number,
  currency: string,
  locationInfo: ILocationInfo,
}

const ManageTreasury: React.FC<IManageTreasury> = ({ funds, gold, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const defaultCC = funds.findIndex(cc => cc.currency === props.currency);

  return (
    <div className='flex flex-col'>
      <div className='flex justify-end gap-4'>
        <Button size='sm' variant='solid' colorScheme='green'>Deposit</Button>
        <Button size='sm' variant='solid' colorScheme='blue'>Withdrawal</Button>
      </div>
      <div className='flex w-full justify-center items-center'>
        <StatGroup className='flex justify-center gap-8 w-1/2'>
          <Stat>
            <StatLabel>Gold</StatLabel>
            <StatNumber>
              <span className='mr-2'>{gold.toFixed(2)}</span>
              <i className='sot-icon sot-coin' />
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>{props.currency}</StatLabel>
            <StatNumber>
              <span className='mr-2'>{defaultCC > -1 && funds[defaultCC].amount.toFixed(2) || 0.00}</span>
              <i className={`flag-icon flag-icon-${props.locationInfo.owner_flag}`} />
            </StatNumber>
          </Stat>
        </StatGroup>
      </div>
    </div>
  );
}

export default ManageTreasury;