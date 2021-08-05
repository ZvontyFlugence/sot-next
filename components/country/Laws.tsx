import { ICountry, IEmbargo, ILaw } from '@/models/Country';
import { IUser } from '@/models/User';
import { LawType } from '@/util/apiHelpers';
import {
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useCallback, useEffect, useState } from 'react';
import Select from '@/components/Select';
import { IGameItem, refreshData, request, showToast } from '@/util/ui';
import { GovActions } from '@/util/actions';
import { ITEMS } from '@/util/constants';
import LawLink from './laws/LawLink';
import OtherTaxLawForm from './laws/OtherTaxLawForm';
import IncomeTaxLawForm from './laws/IncomeTaxLawForm';
import { IoCaretBack, IoCaretForward } from 'react-icons/io5';
import PrintMoneyLawForm from './laws/PrintMoneyLawForm';
import MinWageLawForm from './laws/MinWageLawForm';
import EmbargoLawForm from './laws/EmbargoLawForm';
import AllianceLawForm from './laws/AllianceLawForm';
import { formatDistanceStrict } from 'date-fns';
import DoWLawForm from './laws/DoWLawForm';
import TreatyLawForm from './laws/TreatyLawForm';

interface ILawsTab {
  country: ICountry;
  user: IUser;
}

interface ILawDetails {
  [detail: string]: any;
}

const LawsTab: React.FC<ILawsTab> = ({ country, user }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [lawType, setLawType] = useState<LawType | null>(null);
  const [lawDetails, setLawDetails] = useState<ILawDetails>({});
  const [product, setProduct] = useState<number | null>(null);
  const [lawHistoryPage, setLawHistoryPage] = useState(0);
  const [lawHistoryPageSize, setLawHistoryPageSize] = useState(3);
  const [countries, setCountries] = useState<ICountry[]>([]);

  useEffect(() => {
    request({
      url: '/api/countries',
      method: 'GET',
      token: cookies.token,
    })
      .then(data => setCountries(data.countries ?? []));
  }, []);

  const getGovernmentRole = (): string => {
    switch (user._id) {
      case country.government.president:
        return 'CP';
      case country.government.vp:
        return 'VCP';
      case country.government.cabinet.mofa:
        return 'MoFA';
      case country.government.cabinet.mod:
        return 'MoD';
      case country.government.cabinet.mot:
        return 'MoT';
      default: {
        if (country.government.congress.findIndex(cm => cm.id === user._id) >= 0)
          return 'CM';
        return '';
      }
    }
  }

  const canProposeLaw = (): boolean => {
    let govRole: string = getGovernmentRole();

    if (!govRole)
      return false;

    switch (lawType) {
      case LawType.ALLIANCE:
        return govRole !== 'MoT';
      case LawType.EMBARGO:
        return govRole !== 'MoD';
      case LawType.IMPORT_TAX:
      case LawType.INCOME_TAX:
      case LawType.MINIMUM_WAGE:
      case LawType.PRINT_MONEY:
      case LawType.VAT_TAX: {
        return (govRole !== 'MoFA' && govRole !== 'MoD');
      }
      default:
        return false;
    }
  }

  const getUniqueItems = (): IGameItem[] => {
    return ITEMS.reduce((accum: IGameItem[], item: IGameItem) => {
      let exists: boolean = accum.findIndex((p: IGameItem) => p?.name === item.name) !== -1;

      if (!exists)
        accum.push(item);

      return accum;
    }, []);
  }

  const getLawFormDetails = useCallback(() => {
    switch (lawType) {
      case LawType.ALLIANCE:
        return (
          <AllianceLawForm setCountry={(countryId) => setLawDetails({ country: countryId })} />
        );
      case LawType.DECLARE_WAR:
        return (
          <DoWLawForm country={country._id} setCountry={(countryId) => setLawDetails({ country: countryId })} />
        );
      case LawType.EMBARGO:
        return (
          <EmbargoLawForm setCountry={(countryId) => setLawDetails({ country: countryId })} />
        );
      case LawType.IMPORT_TAX:
        return (
          <OtherTaxLawForm
            product={product}
            percentage={(country.policies.taxes?.import && country.policies.taxes?.import[product]) || 0}
            setProduct={(val) => setProduct(val)}
            setPercentage={(productId, val) => setLawDetails({ [productId]: val })}
          />
        );
      case LawType.INCOME_TAX:
        return (
          <IncomeTaxLawForm
            value={lawDetails.percentage || country.policies.taxes.income}
            setValue={(val) => setLawDetails(prevDetails => ({ ...prevDetails, percentage: val }))}
          />
        );
      case LawType.MINIMUM_WAGE:
        return (
          <MinWageLawForm setAmount={(value) => setLawDetails({ wage: value })} />
        );
      case LawType.PEACE_TREATY:
        return (
          <TreatyLawForm country={country._id} setCountry={(countryId) => setLawDetails({ country: countryId })} />
        );
      case LawType.PRINT_MONEY:
        return (
          <PrintMoneyLawForm setAmount={(value) => setLawDetails({ amount: value })} />
        );
      case LawType.VAT_TAX:
        return (
          <OtherTaxLawForm
            product={product}
            percentage={(country.policies.taxes?.vat && country.policies.taxes?.vat[product]) || 0}
            setProduct={(val) => setProduct(val)}
            setPercentage={(productId, val) => setLawDetails({ [productId]: val })}
          />
        );
      default:
        return <></>;
    }
  }, [lawType]);

  const handleCloseModal = () => {
    setLawType(null);
    onClose();
  }

  const proposeLaw = () => {
    if (!canProposeLaw()) {
      showToast(toast, 'error', 'Law Proposal Failed', 'You cannot propose this law');
      return;
    }

    let payload = {
      action: GovActions.PROPOSE_LAW,
      data: {
        lawType,
        lawDetails,
      },
    };

    request({
      url: `/api/countries/${country._id}/doGovAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
        onClose();
        setLawType(null);
        setLawDetails({});
      } else {
        showToast(toast, 'error', 'Failed to Propose Law', data?.error);
      }
    });
  }

  const getPageDetails = (): { start: number, end: number } => {
    if (country.pastLaws.length <= lawHistoryPageSize)
      return { start: 0, end: country.pastLaws.length };
    else if (country.pastLaws.length <= ((lawHistoryPage + 1) * lawHistoryPageSize))
      return { start: (lawHistoryPage * lawHistoryPageSize), end: country.pastLaws.length };
    
    return { start: (lawHistoryPage * lawHistoryPageSize), end: ((lawHistoryPage + 1) * lawHistoryPageSize) };
  }

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl text-accent'>Laws</h2>
        <Button
          size='sm'
          colorScheme='green'
          onClick={onOpen}
          disabled={getGovernmentRole() === ''}
        >
          Propose Law
        </Button>
      </div>
      <h4 className='text-lg mt-4 mb-2 text-center'>Current Policies</h4>
      <div className='flex md:flex-row flex-col items-start justify-center md:gap-24 gap-8'>
        <div className='flex flex-col align-start gap-2'>
          <p>Government Type: <span className='capitalize'>{country.policies.governmentType}</span></p>
          <p>Minimum Wage: {country.policies.minWage.toFixed(2)} <i className={`flag-icon flag-icon-${country.flag_code} rounded shadow-md`} /> {country.currency}</p>
          <p>Income Tax: {country.policies.taxes.income}%</p>
          
        </div>
        <div className='flex flex-col align-start gap-2'>
          <div>
            Import Tax:
            {getUniqueItems().map((item: IGameItem, i: number) => (
              <p key={i} className='flex justify-start items-center'>
                <span className='flex items-center gap-2'>
                  <i className={`sot-icon ${item?.image}`} title={item?.name} />
                  {item?.name}
                </span>
                <span className='ml-2'>{(country.policies.taxes?.import && country.policies.taxes.import[item?.id]) || 0}%</span>
              </p>
            ))}
          </div>
        </div>
        <div className='flex flex-col align-start gap-2'>
          <div>
              Value-Added Tax:
              {getUniqueItems().map((item: IGameItem, i: number) => (
                <p key={i} className='flex items-center'>
                  <span className='flex items-center gap-2'>
                    <i className={`sot-icon ${item?.image}`} title={item?.name} />
                    {item?.name}
                  </span>
                  <span className='ml-2'>{(country.policies.taxes?.vat && country.policies.taxes.vat[item?.id]) || 0}%</span>
                </p>
              ))}
            </div>
        </div>
        <div className='flex flex-col align-start gap-2'>
          <p>Embargoes:</p>
          <div>
            {country.policies.embargos.map((embargo: IEmbargo, i: number) => (
              <div key={i} className='flex justify-between items-center'>
                <p className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/country/${embargo.country}`)}>
                  <i className={`flag-icon flag-icon-${countries[embargo.country - 1]?.flag_code} rounded shadow-md`} />
                  {countries[embargo.country - 1]?.name}
                </p>
                <span className='ml-8 text-gray-300 text-sm'>{formatDistanceStrict(new Date(embargo?.expires), new Date(Date.now()))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h4 className='text-lg mt-4 mb-2 text-center'>Pending Laws</h4>
      <div className='flex flex-col justify-center items-center gap-2'>
        {country.pendingLaws.length > 0 ? country.pendingLaws.slice(0).reverse().map((law: ILaw, i: number) => (
          <LawLink key={i} law={law} countryId={country._id} />
        )) : (
          <p>Country Has No Pending Laws</p>
        )}
      </div>
      <h4 className='text-lg mt-4 mb-2 text-center'>Law History</h4>
      <div className='flex flex-col justify-center items-center gap-2'>
        {country.pastLaws.length > 0 ? country.pastLaws.slice(0).reverse().slice(...Object.values(getPageDetails())).map((law: ILaw, i: number) => (
          <LawLink key={i} law={law} countryId={country._id} />
        )) : (
          <p>Country Has No Past Laws</p>
        )}
        <div className='flex justify-center items-center gap-8 my-4'>
          <ButtonGroup isAttached variant='outline'>
            <IconButton
              aria-label='Previous Page'
              icon={<IoCaretBack />}
              onClick={() => setLawHistoryPage(curr => curr - 1)}
              disabled={lawHistoryPage === 0}
            />
            <Button _hover={{ bg: 'initial', cursor: 'default' }}>{lawHistoryPage + 1}</Button>
            <IconButton
              aria-label='Next Page'
              icon={<IoCaretForward />}
              onClick={() => setLawHistoryPage(curr => curr + 1)}
              disabled={((lawHistoryPage + 1) * lawHistoryPageSize) >= country.pastLaws.length}
            />
          </ButtonGroup>
          <Select className='border border-white border-opacity-25 rounded shadow-md' selected={lawHistoryPageSize} onChange={(value) => setLawHistoryPageSize(value as number)}>
            {[3, 5, 10, 15, 25, 50].map((num: number, i: number) => (
              <Select.Option key={i} value={num}>{num}</Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent bgColor='night' color='white'>
          <ModalHeader className='h-brand text-accent text-xl'>Propose Law</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Law Type</FormLabel>
              <Select className='border border-white border-opacity-25 rounded shadow-md' selected={lawType} onChange={(val) => setLawType(val as LawType)}>
                <Select.Option value={null} disabled>
                  Select Law Type
                </Select.Option>
                <Select.Option value={LawType.ALLIANCE}>
                  <span className='capitalize'>{LawType.ALLIANCE}</span>
                </Select.Option>
                <Select.Option value={LawType.DECLARE_WAR}>
                  <span className='capitalize'>{LawType.DECLARE_WAR.replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.EMBARGO}>
                  <span className='capitalize'>{LawType.EMBARGO}</span>
                </Select.Option>
                <Select.Option value={LawType.INCOME_TAX}>
                  <span className='capitalize'>{LawType.INCOME_TAX.replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.IMPEACH_CP}>
                  <span className='capitalize'>{LawType.IMPEACH_CP.replace('cp', 'president').replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.IMPORT_TAX}>
                  <span className='capitalize'>{LawType.IMPORT_TAX.replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.MINIMUM_WAGE}>
                  <span className='capitalize'>{LawType.MINIMUM_WAGE.replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.PEACE_TREATY}>
                  <span className='capitalize'>{LawType.PEACE_TREATY.replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.PRINT_MONEY}>
                  <span className='capitalize'>{LawType.PRINT_MONEY.replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.VAT_TAX}>
                  <span className='capitalize'>
                    {LawType.VAT_TAX.replace(/_/g, ' ')
                      .split(' ')
                      .map((txt: string, idx: number) => {
                        if (idx === 0)
                          return txt.toUpperCase();
                        
                        return txt;
                      })
                      .join(' ')
                    }
                  </span>
                </Select.Option>
              </Select>
            </FormControl>
            {lawType !== null && getLawFormDetails()}
          </ModalBody>
          <ModalFooter className='flex items-center gap-4'>
            <Button size='sm' colorScheme='green' onClick={proposeLaw} disabled={!canProposeLaw()}>Propose</Button>
            <Button size='sm' variant='outline' colorScheme='whiteAlpha' onClick={handleCloseModal}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default LawsTab;