import { ICountry, ILaw } from '@/models/Country';
import { IUser } from '@/models/User';
import { LawType } from '@/util/apiHelpers';
import { Avatar, Button, FormControl, FormLabel, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Stat, StatLabel, StatNumber, useDisclosure, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useCallback, useState } from 'react';
import Select from '@/components/Select';
import { IGameItem, refreshData, request, showToast } from '@/util/ui';
import { GovActions } from '@/util/actions';
import { useEffect } from 'react';
import { format, formatDuration } from 'date-fns';
import { ITEMS } from '@/util/constants';

interface ILawsTab {
  country: ICountry;
  user: IUser;
}

interface ILawDetails {
  [detail: string]: any;
}

// TODO: Add paging for pastLaws
const LawsTab: React.FC<ILawsTab> = ({ country, user }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [lawType, setLawType] = useState<LawType | null>(null);
  const [lawDetails, setLawDetails] = useState<ILawDetails>({});
  const [product, setProduct] = useState<number | null>(null);

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
      case LawType.INCOME_TAX: {
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
      case LawType.INCOME_TAX:
        return (
          <IncomeTaxLawForm
            value={lawDetails.percentage || country.policies.taxes.income}
            setValue={(val) => setLawDetails(prevDetails => ({ ...prevDetails, percentage: val }))}
          />
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
      } else {
        showToast(toast, 'error', 'Failed to Propose Law', data?.error);
      }
    });
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
      <div className='flex items-start justify-center gap-24'>
        <div className='flex flex-col align-start gap-2'>
          <p>Government Type: <span className='capitalize'>{country.policies.governmentType}</span></p>
          <p>Minimum Wage: {country.policies.minWage.toFixed(2)} <i className={`flag-icon flag-icon-${country.flag_code}`} /> {country.currency}</p>
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
          <p>Embargoes: {country.policies.embargos.length}</p>
        </div>
      </div>
      <h4 className='text-lg mt-4 mb-2 text-center'>Pending Laws</h4>
      <div className='flex flex-col justify-center items-center gap-2'>
        {country.pendingLaws.length > 0 ? country.pendingLaws.map((law: ILaw, i: number) => (
          <LawLink key={i} law={law} countryId={country._id} />
        )) : (
          <p>Country Has No Pending Laws</p>
        )}
      </div>
      <h4 className='text-lg mt-4 mb-2 text-center'>Law History</h4>
      <div className='flex flex-col justify-center items-center gap-2'>
        {country.pastLaws.length > 0 ? country.pastLaws.map((law: ILaw, i: number) => (
          <LawLink key={i} law={law} countryId={country._id} />
        )) : (
          <p>Country Has No Past Laws</p>
        )}
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
                <Select.Option value={LawType.INCOME_TAX}>
                  <span className='capitalize'>{LawType.INCOME_TAX.replace(/_/g, ' ')}</span>
                </Select.Option>
                <Select.Option value={LawType.IMPORT_TAX}>
                  <span className='capitalize'>{LawType.IMPORT_TAX.replace(/_/g, ' ')}</span>
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
            <Button size='sm' colorScheme='green' onClick={proposeLaw}>Propose</Button>
            <Button size='sm' variant='outline' colorScheme='whiteAlpha' onClick={handleCloseModal}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

interface IIncomeTaxLawForm {
  value: number,
  setValue: (val: number) => void;
}

function IncomeTaxLawForm({ value, setValue }: IIncomeTaxLawForm) {
  return (
    <div className='mt-2'>
      <FormControl>
        <FormLabel>Percentage:</FormLabel>
        <NumberInput
          className='border border-white border-opacity-25 rounded shadow-md'
          min={0}
          max={100}
          step={1}
          defaultValue={value}
          onChange={(_, val) => setValue(val)}
        >
          <NumberInputField />
          <NumberInputStepper >
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
    </div>
  );
}

interface IOtherTaxLawForm {
  product: number | null;
  setProduct: (productId: number) => void;
  percentage: number;
  setPercentage: (productId: number, percentage: number) => void;
}

function OtherTaxLawForm({ product, percentage, setProduct, setPercentage }: IOtherTaxLawForm) {
  const [productId, setProductId] = useState<number | null>(product);

  const updateProduct = (value: number) => {
    setProductId(value);
    setProduct(value);
  }

  return (
    <>
      <div className='mt-2'>
        <FormControl>
          <FormLabel>Product</FormLabel>
          <Select className='border border-white border-opacity-25 rounded shadow-md' selected={product} onChange={(value) => updateProduct(value as number)}>
            <Select.Option disabled value={null}>
              Select Product Type
            </Select.Option>
            {ITEMS.reduce((accum: IGameItem[], item: any) => {
              let exists = accum.findIndex((p: IGameItem) => p.name === item.name) !== -1;

              if (!exists)
                accum.push(item);

              return accum;
            }, []).map((item: IGameItem, i: number) => (
              <Select.Option key={i} value={item.id}>
                <p className='flex items-center'>
                  <span className='flex items-center gap-2'>
                    <i className={`sot-icon ${item.image}`} title={item.name} />
                    {item.name}
                  </span>
                </p>
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      </div>
      <div className='mt-2'>
        <FormControl>
          <FormLabel>Percentage</FormLabel>
          <NumberInput
          className='border border-white border-opacity-25 rounded shadow-md'
          min={0}
          max={100}
          step={1}
          defaultValue={percentage}
          onChange={(_, val) => setPercentage(productId, val)}
        >
          <NumberInputField />
          <NumberInputStepper >
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        </FormControl>
      </div>
    </>
  );
}

interface ILawLink {
  countryId: number;
  law: ILaw;
}

function LawLink({ countryId, law }: ILawLink) {
  const cookies = parseCookies();
  const router = useRouter();

  const [lawAuthor, setLawAuthor] = useState<IUser>();

  useEffect(() => {
    request({
      url: `/api/users/${law.proposedBy}`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.user)
        setLawAuthor(data.user);
    });
  }, []);

  const getLawName = (type: LawType) => {
    switch (type) {
      case LawType.INCOME_TAX:
        return 'Change Income Tax';
      case LawType.IMPORT_TAX:
        return 'Change Import Tax';
      case LawType.VAT_TAX:
        return 'Change VAT Tax';
      default:
        return 'Unknown Law';
    }
  }

  const getTimeRemaining = () => {
    let now = new Date(Date.now());
    let expires = new Date(law.expires);

    return expires > now ? formatDuration({
      hours: 24 - Math.abs(now.getUTCHours() - expires.getUTCHours()),
      minutes: 60 - Math.abs(now.getUTCMinutes() - expires.getUTCMinutes())
    }) : format(expires, 'MM/dd/yyyy');
  }

  return (
    <div className='flex items-center justify-between w-full px-4 py-2 border border-white border-opacity-25 rounded shadow-md'>
      <div className='flex flex-col gap-2'>
        <span className='text-accent-alt text-xl'>{getLawName(law.type)}</span>
        <span>Expires in {getTimeRemaining()}</span>
      </div>
      <div className='flex items-center gap-8'>
        <Stat>
          <StatLabel>Yes</StatLabel>
          <StatNumber className='text-center'>
            {law.votes.filter(vote => vote.choice === 'yes').length}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel>No</StatLabel>
          <StatNumber className='text-center'>
            {law.votes.filter(vote => vote.choice === 'no').length}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Abstain</StatLabel>
          <StatNumber className='text-center'>
            {law.votes.filter(vote => vote.choice === 'abstain').length}
          </StatNumber>
        </Stat>
      </div>
      <div>
        <Button size='sm' colorScheme='blue' onClick={() => router.push(`/country/${countryId}/law/${law.id}`)}>
          {new Date(law.expires) > new Date(Date.now()) ? 'Vote' : 'View'}
        </Button>
      </div>
    </div>
  );
}

export default LawsTab;