import { EconomicStance, IParty, SocialStance } from '@/models/Party';
import { PartyActions } from '@/util/actions';
import { refreshData, request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/slider';
import { useToast } from '@chakra-ui/toast';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useState } from 'react';

interface IPartySettingsProps {
  user_id: number,
  party: IParty,
}

const PartySettings: React.FC<IPartySettingsProps> = ({ user_id: _uid, party }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState<string>(party.name);
  const [econStance, setEconStance] = useState<EconomicStance>(party.economicStance as EconomicStance);
  const [socStance, setSocStance] = useState<SocialStance>(party.socialStance as SocialStance);
  const [color, setColor] = useState<string>(party.color);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: any) => {
    const targetFile: File | null = e.target.files[0];
    setFile(targetFile);
  }
  
  const updateName = () => {
    let payload = {
      action: PartyActions.UPDATE_NAME,
      data: { name },
    };

    request({
      url: `/api/parties/${party._id}/doAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Party Name Failed', data?.error);
      }
    });
  }

  const updateLogo = (e: any) => {
    e.preventDefault();

    let reader: FileReader = new FileReader();
    reader.onloadend = () => {
      let base64 = reader.result;
      let payload = {
        action: PartyActions.UPDATE_LOGO,
        data: { image: base64 },
      };

      request({
        url: `/api/parties/${party._id}/doAction`,
        method: 'POST',
        payload,
        token: cookies.token,
      }).then(data => {
        if (data.success) {
          showToast(toast, 'success', data?.message);
          setFile(null);
          refreshData(router);
        } else {
          showToast(toast, 'error', 'Upload Failed', data?.error);
        }
      });
    };

    reader.readAsDataURL(file);
  }

  const updateEconStance = () => {
    let payload = {
      action: PartyActions.UPDATE_ECON,
      data: { value: econStance },
    };

    request({
      url: `/api/parties/${party._id}/doAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Party Stance Failed', data?.error);
      }
    });
  }

  const updateSocStance = () => {
    let payload = {
      action: PartyActions.UPDATE_SOC,
      data: { value: socStance },
    };

    request({
      url: `/api/parties/${party._id}/doAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Party Stance Failed', data?.error);
      }
    });
  }

  const updateColor = () => {
    let payload = {
      action: PartyActions.UPDATE_COLOR,
      data: { color },
    };

    request({
      url: `/api/parties/${party._id}/doAction`,
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Party Color Failed', data?.error);
      }
    });
  }

  return (
    <div className='bg-night shadow-md rounded w-full px-4 py-2'>
      <h3 className='text-xl text-accent font-semibold'>Party Settings</h3>
      <div className="flex items-start gap-8 mt-4 text-white">
        <div className='flex flex-col gap-4 flex-grow'>
          <FormControl>
            <FormLabel>Party Name</FormLabel>
            <Input type='text' value={name} onChange={e => setName(e.target.value)} />
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={updateName}
            >
              Update Name
            </Button>
          </FormControl>
          <FormControl>
            <FormLabel>Economic Stance</FormLabel>
            <p className='text-center'>{EconomicStance.toString(econStance)}</p>
            <Slider
              aria-label='econ-slider'
              defaultValue={econStance}
              min={-1.0}
              max={1.0}
              step={0.25}
              onChange={val => setEconStance(val as EconomicStance)}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={updateEconStance}
            >
              Update Stance
            </Button>
          </FormControl>
          <FormControl>
            <FormLabel>Social Stance</FormLabel>
            <p className='text-center'>{SocialStance.toString(socStance)}</p>
            <Slider
              aria-label='econ-slider'
              defaultValue={socStance}
              min={-0.99}
              max={0.99}
              step={0.33}
              onChange={val => setSocStance(val as SocialStance)}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={updateSocStance}
            >
              Update Stance
            </Button>
          </FormControl>
        </div>
        <div className='flex flex-col gap-4 flex-grow'>
          <FormControl>
            <FormLabel className="text-xl">Party Logo</FormLabel>
            <Input type='file' accept='image/*' onChange={handleFileChange} />
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={updateLogo}
            >
              Update Logo
            </Button>
          </FormControl>
          <FormControl>
            <FormLabel className='text-xl'>Party Color</FormLabel>
            <Input type='text' value={color} onChange={e => setColor(e.target.value)} />
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              onClick={updateColor}
            >
              Update Color
            </Button>
          </FormControl>
        </div>      
      </div>
    </div>
  );
}

export default PartySettings;