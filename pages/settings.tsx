import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { useUser } from '@/context/UserContext';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { getCurrentUser } from '@/util/auth';
import { refreshData, request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Textarea } from '@chakra-ui/textarea';
import { useToast } from '@chakra-ui/toast';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

export const getAllRegionsFetcher = (url: string, token: string) => request({ url, method: 'GET', token });

const Settings: React.FC = () => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const user = useUser();

  const [selectedRegion, setSelectedRegion] = useState(-1);
  const [selectedResidence, setSelectedResidence] = useState(-1);
  const [username, setUsername] = useState('');
  const [newPw, setNewPw] = useState('');
  const [currPw, setCurrPw] = useState('');
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState('');

  const { mutate } = useSWRConfig();
  const regionQuery = useSWR(['/api/regions', cookies.token], getAllRegionsFetcher);

  const handleUpdateUsername = () => {
    let payload = {
      action: UserActions.UPDATE_NAME,
      data: { username },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setUsername('');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Username Failed', data?.error);
      }
    });
  }

  const handleUpdatePw = () => {
    let payload = {
      action: UserActions.UPDATE_PW,
      data: { currPw, newPw },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setCurrPw('');
        setNewPw('');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Failed', data?.error);
      }
    });
  }

  const handleTravel = () => {
    let payload = {
      action: UserActions.TRAVEL,
      data: { region_id: selectedRegion },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setSelectedRegion(-1);
        mutate('/api/me/location-info');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Relocation Failed', data?.error);
      }
    });
  }

  const handleMoveResidence = () => {
    let payload = {
      action: UserActions.MOVE_RESIDENCE,
      data: { region_id: selectedResidence },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setSelectedRegion(-1);
        mutate('/api/me');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Residence Relocation Failed', data?.error);
      }
    });
  }

  const handleFileChange = e => {
    const targetFile = e.target.files[0];
    setFile(targetFile);
  }

  const handleUpload = e => {
    e.preventDefault();

    let reader = new FileReader();
    reader.onloadend = () => {
      let base64 = reader.result;
      let payload = {
        action: UserActions.UPLOAD_PFP,
        data: { image: base64 },
      };

      request({
        url: '/api/me/doAction',
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

  const handleUpdateDesc = () => {
    let payload = {
      action: UserActions.UPDATE_DESC,
      data: { desc },
    };

    request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setDesc('');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Description Failed', data?.error);
      }
    });
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl text-accent pl-4 font-semibold'>Settings</h1>
      <div className='flex md:flex-row flex-col justify-center items-center w-full pb-24'>
        <div className='flex flex-col gap-6 bg-night rounded shadow-md py-4 px-8 text-white'>
          <div className='flex md:flex-row flex-col gap-8'>
            <FormControl>
              <FormLabel className='text-xl'>Update Username</FormLabel>
              <Input type='text' defaultValue={user.username} onChange={e => setUsername(e.target.value)} />
              <Button
                className='mt-2'
                variant='outline'
                color='accent-alt'
                colorScheme='whiteAlpha'
                onClick={handleUpdateUsername}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <FormLabel className='text-xl'>Update Profile Picture</FormLabel>
              <Input type='file' accept='image/*' onChange={handleFileChange} />            
              <Button
                className='mt-2'
                variant='outline'
                color='accent-alt'
                colorScheme='whiteAlpha'
                onClick={handleUpload}
              >
                Update
              </Button>
            </FormControl>
          </div>
          <FormControl>
            <FormLabel className='text-xl'>Update Password</FormLabel>
            <div className='flex md:flex-row flex-col md:gap-8 gap-2'>
              <Input
                type='password'
                placeholder='New Password'
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
              />
              <Input
                type='password'
                placeholder='Current Password'
                value={currPw}
                onChange={e => setCurrPw(e.target.value)}
              />
            </div>
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={handleUpdatePw}
            >
              Update
            </Button>
          </FormControl>
          <FormControl>
            <FormLabel className='text-xl'>Update Description</FormLabel>
            <Textarea defaultValue={user.description} onChange={e => setDesc(e.target.value)} />
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={handleUpdateDesc}
            >
              Update
            </Button>
          </FormControl>
          <FormControl>
            <FormLabel className='text-xl'>Travel</FormLabel>
            {regionQuery.data && (
              <Select className='border border-white border-opacity-25 rounded shadow-md' selected={selectedRegion} onChange={val => setSelectedRegion(val as number)}>
                {[null].concat(regionQuery.data?.regions as any[])?.map((region, i) => (
                  <Select.Option key={i} value={region ? region._id : -1} disabled={!region}>{region ? region.name : 'Select Region'}</Select.Option>
                ))}
              </Select>
            )}
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={handleTravel}
            >
              Update
            </Button>
          </FormControl>
          <FormControl>
            <FormLabel className='text-xl'>Move Residence</FormLabel>
            {regionQuery.data && (
              <Select className='border border-white border-opacity-25 rounded shadow-md' selected={selectedResidence} onChange={val => setSelectedResidence(val as number)}>
                {[null].concat(regionQuery.data?.regions as any[])?.map((region, i) => (
                  <Select.Option key={i} value={region ? region._id : -1} disabled={!region}>{region ? region.name : 'Select Region'}</Select.Option>
                ))}
              </Select>
            )}
            <Button
              className='mt-2'
              variant='outline'
              color='accent-alt'
              colorScheme='whiteAlpha'
              onClick={handleMoveResidence}
            >
              Update
            </Button>
          </FormControl>
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  return {
    props: {},
  };
}

export default Settings;