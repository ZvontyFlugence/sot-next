import { ICompany } from '@/models/Company';
import { refreshData, request, showToast } from '@/util/ui';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { useToast } from '@chakra-ui/toast';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';
import { useState } from 'react';
import Select from '../Select';
import { CompanyActions } from '@/util/actions';
import useSWR from 'swr';
import { getAllRegionsFetcher } from '@/pages/settings';

interface ICompanySettings {
  company: ICompany,
}

// TODO: Implement Backend Functions and Sell/Delete Company
const CompanySettings: React.FC<ICompanySettings> = ({ company }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [region, setRegion] = useState(-1);
  const [file, setFile] = useState(null);

  const regionQuery = useSWR(['/api/regions', cookies.token], getAllRegionsFetcher);

  const handleUpdateName = () => {
    let payload = {
      action: CompanyActions.UPDATE_NAME,
      data: { company_id: company._id, name },
    };

    request({
      url: '/api/companies/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setName('');
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Update Failed', data?.error);
      }
    });
  }

  const handleTravel = () => {
    let payload = {
      action: CompanyActions.RELOCATE,
      data: { company_id: company._id, region_id: region },
    };

    request({
      url: '/api/companies/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setRegion(-1);
        refreshData(router);
      } else {
        showToast(toast, 'error', 'Relocation Failed', data?.error);
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
        action: CompanyActions.UPLOAD_LOGO,
        data: { company_id: company._id, image: base64 },
      };

      request({
        url: '/api/companies/doAction',
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

  return (
    <div className='flex gap-8'>
      <div className='flex flex-col gap-6'>
        <FormControl>
          <FormLabel className='text-xl'>Update Company Name</FormLabel>
          <Input type='text' defaultValue={company.name} onChange={e => setName(e.target.value)} />
          <Button
            className='mt-2'
            variant='outline'
            color='accent-alt'
            colorScheme='whiteAlpha'
            onClick={handleUpdateName}
          >
            Update
          </Button>
        </FormControl>
        <FormControl>
          <FormLabel className='text-xl'>Travel</FormLabel>
          <Select className='border border-white border-opacity-25 rounded shadow-md' onChange={val => setRegion(val as number)}>
            <Select.Option value={-1} disabled>Select Region</Select.Option>
            {regionQuery.data && regionQuery.data?.regions?.map((region, i) => (
              <Select.Option key={i} value={region._id}>{region.name}</Select.Option>
            ))}
          </Select>
          <Button
            className='mt-2'
            variant='outline'
            color='accent-alt'
            colorScheme='whiteAlpha'
            onClick={handleTravel}
          >
            Relocate
          </Button>
        </FormControl>
      </div>
      <div className='flex flex-col gap-6'>
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
    </div>
  );
}

export default CompanySettings;