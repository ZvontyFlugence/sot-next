import { IAlly, ICountry } from '@/models/Country';
import { IRegion } from '@/models/Region';
import { IUser } from '@/models/User';
import { IWar } from '@/models/War';
import { GovActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Button, FormControl, FormLabel, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, useToast } from '@chakra-ui/react';
import { formatDistanceStrict } from 'date-fns';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';
import Select from '../Select';

interface IMilitary {
  country: ICountry;
  user: IUser;
}

// TODO: Handle Retreat Modal and Retreating From Battles
export default function Military({ country, user }: IMilitary) {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [countries, setCountries] = useState<ICountry[]>([]);
  const [wars, setWars] = useState<IWar[]>([]);
  const [regions, setRegions] = useState<IRegion[]>([]);
  const [selectedWar, setSelectedWar] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<number>(-1);
  const [selectedRegion, setSelectedRegion] = useState<number>(-1);

  const { isOpen: isAttackOpen, onOpen: onAttackOpen, onClose: onAttackClose } = useDisclosure();
  const { isOpen: isRetreatOpen, onOpen: onRetreatOpen, onClose: onRetreatClose } = useDisclosure();

  useEffect(() => {
    request({
      url: '/api/countries',
      method: 'GET',
    })
      .then(data => setCountries(data?.countries ?? []));

    request({
      url: `/api/wars/involving/${country._id}`,
      method: 'GET',
      token: cookies.token,
    })
      .then(data => setWars(data?.wars ?? []));
  }, []);

  useEffect(() => {
    if (selectedCountry > 0) {
      request({
        url: `/api/countries/${country._id}/neighbors?target=${selectedCountry}`,
        method: 'GET',
        token: cookies.token,
      }).then(data => setRegions(data?.regions.sort((a, b) => a.name.localeCompare(b.name)) ?? []));
    }
  }, [country, selectedCountry]);

  useEffect(() => {
    console.log('Selected War:', selectedWar);
  }, [selectedWar]);

  const hasPermission = (): boolean => {
    switch (user._id) {
      case country.government.president:
      case country.government.vp:
      case country.government.cabinet.mod:
        return true;
      default:
        return false;
    }
  }

  const handleCloseAttackModal = () => {
    setSelectedWar('');
    setSelectedCountry(-1);
    onAttackClose();
  }

  const getWarOpponents = (): any[] => {
    let war: IWar = wars.find(war => `${war._id}` === selectedWar);

    if (war?.sourceAllies.includes(country._id))
      return war.targetAllies;
    else if (war?.targetAllies.includes(country._id))
      return war?.sourceAllies;
    
    return [];
  }

  const handleAttackRegion = () => {
    console.log('Selected War:', selectedWar);
    let payload = {
      action: GovActions.ATTACK,
      data: {
        warId: selectedWar,
        targetCountry: selectedCountry,
        targetRegion: selectedRegion,
      },
    };

    request({
      url: `/api/countries/${country._id}/doGovAction`,
      method: 'POST',
      payload,
      token: cookies.token
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        handleCloseAttackModal();
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Attack Region Failed', data?.error);
      }
    });
  }

  return (
    <div className='w-full'>
      <h2 className='text-xl text-accent'>Military</h2>
      <h4 className='text-lg mt-4 mb-2 text-center'>Current Military Policies</h4>
      <div className='flex justify-center items-center gap-24'>
        <div className='flex flex-col items-center gap-2'>
          <p>Allies:</p>
          {country.policies.allies.length > 0 ? country.policies.allies.map((ally: IAlly, i: number) => (
            <div key={i} className='flex justify-between items-center'>
              <p className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/country/${countries[ally.country - 1]?._id}`)}>
                <i className={`flag-icon flag-icon-${countries[ally.country - 1]?.flag_code} rounded shadow-md`} />
                {countries[ally.country - 1]?.name}
              </p>
              <span className='ml-8 text-gray-300 text-sm'>
                {formatDistanceStrict(new Date(ally?.expires), new Date(Date.now()))}
              </span>
            </div>
          )) : (
            <p>Country Has No Allies</p>
          )}
        </div>
        <div className='flex flex-col items-center gap-2'>
          <p>Active Wars:</p>
          {wars.length > 0 ? wars.map((war: IWar, i: number) => (
            <div key={i} className='flex justify-between items-center gap-2'>
              <p className='flex items-center gap-2 cursor-pointer'>
                <i className={`flag-icon flag-icon-${countries[war.source - 1]?.flag_code} rounded shadow-md`} />
                {countries[war.source - 1]?.name}
              </p>
              <span>vs.</span>
              <p className='flex items-center gap-2 cursor-pointer'>
                <i className={`flag-icon flag-icon-${countries[war.target - 1]?.flag_code} rounded shadow-md`} />
                {countries[war.target - 1]?.name}
              </p>
              <Button size='xs' colorScheme='blue' onClick={() => router.push(`/war/${war._id}`)}>View</Button>
            </div>
          )) : (
            <p>Country Has No Active Wars</p>
          )}
        </div>
      </div>
      {hasPermission() && (
        <>
          <h4 className='text-lg mt-4 mb-2 text-center'>Military Actions</h4>
          <div className='flex justify-center items-center gap-24'>
            <Button size='sm' colorScheme='blue' onClick={onAttackOpen}>Attack Region</Button>
            <Button size='sm' colorScheme='red'>Retreat From Battle</Button>
          </div>
          <Modal isOpen={isAttackOpen} onClose={handleCloseAttackModal}>
            <ModalOverlay />
            <ModalContent bg="night" color='white'>
              <ModalHeader className='h-brand text-accent'>
                Attack Region
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <FormControl>
                  <FormLabel>Select War</FormLabel>
                  <Select selected={selectedWar} onChange={(val) => setSelectedWar(val as string)}>
                    <Select.Option value='' disabled>Select One...</Select.Option>
                    {wars.map((war: IWar, i: number) => (
                      <Select.Option key={i} value={`${war._id}`}>
                        <div className='flex justify-between items-center gap-2'>
                          <p className='flex items-center gap-2 cursor-pointer'>
                            <i className={`flag-icon flag-icon-${countries[war.source - 1]?.flag_code} rounded shadow-md`} />
                            {countries[war.source - 1]?.name}
                          </p>
                          <span>vs.</span>
                          <p className='flex items-center gap-2 cursor-pointer'>
                            <i className={`flag-icon flag-icon-${countries[war.target - 1]?.flag_code} rounded shadow-md`} />
                            {countries[war.target - 1]?.name}
                          </p>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </FormControl>
                {selectedWar !== '' && (
                  <>
                    <FormControl>
                      <FormLabel>Select Country</FormLabel>
                      <Select selected={selectedCountry} onChange={(val) => setSelectedCountry(val as number)}>
                        <Select.Option value={-1} disabled>Select One...</Select.Option>
                        {countries.filter(c => getWarOpponents().includes(c._id)).map((country: ICountry, i: number) => (
                          <Select.Option key={i} value={country._id}>
                            <div className='flex items-center gap-2'>
                              <i className={`flag-icon flag-icon-${country.flag_code} rounded shadow-md`} />
                              {country.name}
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedCountry > 0 && (
                      <FormControl>
                        <FormLabel>Select Region</FormLabel>
                        <Select selected={selectedRegion} onChange={(val) => setSelectedRegion(val as number)}>
                          <Select.Option value={-1} disabled>Select One...</Select.Option>
                          {regions.map((region: IRegion, i: number) => (
                            <Select.Option key={i} value={region._id}>
                              <span>{region.name}</span>
                            </Select.Option>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </>
                )}
              </ModalBody>
              <ModalFooter className='flex gap-4'>
                <Button 
                  colorScheme='green'
                  disabled={selectedRegion === -1}
                  onClick={handleAttackRegion}
                >
                  Attack
                </Button>
                <Button
                  variant='outline'
                  _hover={{ bg: 'white', color: 'night' }}
                  onClick={handleCloseAttackModal}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </div>
  );
}