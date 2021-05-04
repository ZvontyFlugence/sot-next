import { ICompany } from "@/models/Company";
import { ICEOInfo, ILocationInfo } from "@/util/apiHelpers";
import { Avatar } from "@chakra-ui/avatar";
import { Image } from "@chakra-ui/image";
import { EditIcon } from '@chakra-ui/icons';
import { useRouter } from "next/router";
import { IconButton } from "@chakra-ui/button";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/stat";
import { ITEMS } from "@/util/constants";

interface ICompHeader {
  company: ICompany,
  locationInfo: ILocationInfo,
  ceoInfo: ICEOInfo,
  userId: number,
  onManage: () => void,
}

const CompanyHeader: React.FC<ICompHeader> = ({ company, locationInfo, ceoInfo, userId, onManage }) => {
  const router = useRouter();
  let company_item = ITEMS[company.type];

  return (
    <div className='bg-night text-white p-4 shadow-md rounded'>
      <div className='flex flex-row items-stretch gap-4'>
        <Image boxSize='12.0rem' src={company.image} alt='' />
        <div className='flex flex-col w-full items-top'>
          <h3 className='text-xl font-semibold text-accent'>{company.name}</h3>
          <p className='flex flex-row items-center mt-4'>
            <p>
              Type:&nbsp;
              <i className={company_item.image} title={company_item.name} />
            </p>
            <p className='ml-8'>
              <span className='mr-2'>Location:</span>
              <span className='cursor-pointer mr-2' onClick={() => router.push(`/region/${company.location}`)}>
                {locationInfo.region_name},
              </span>
              <span className='cursor-pointer' onClick={() => router.push(`/country/${locationInfo.owner_id}`)}>
                {locationInfo.owner_name}
                <span className={`ml-2 flag-icon flag-icon-${locationInfo.owner_flag}`}></span>
              </span>
            </p>
          </p>
          <span className='flex flex-row items-center mt-4'>
              <span className='mr-2'>CEO:</span>
              <span className='flex flex-row items-center cursor-pointer' onClick={() => router.push(`/profile/${ceoInfo.ceo_id}`)}>
                <Avatar size='sm' name={ceoInfo.ceo_name} src={ceoInfo.ceo_image} />
                <span className='ml-2'>{ceoInfo.ceo_name}</span>
              </span>
            </span>
          <div className='grid grid-cols-2 mt-4 w-full'>
            <Stat>
              <StatLabel>Employees</StatLabel>
              <StatNumber>{company.employees.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Worth</StatLabel>
              <StatNumber>
                <span className='mr-2'>{company.gold.toFixed(2)}</span>
                <i className='sot-icon sot-coin' />
              </StatNumber>
            </Stat>
          </div>
        </div>
        <div className='flex flex-col justify-self-start self-start'>
          <IconButton
            aria-label='Manage Company Button'
            variant='outline'
            colorScheme=''
            icon={<EditIcon />}
            disabled={userId !== company.ceo}
            onClick={onManage}
          />
        </div>
      </div>
    </div>
  );
}

export default CompanyHeader;