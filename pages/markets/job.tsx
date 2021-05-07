import Layout from '@/components/Layout';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import { IUser } from '@/models/User';
import { IJobMarketOffer, ILocationInfo, jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { COMPANY_TYPES } from '@/util/constants';
import { refreshData, request, showToast } from '@/util/ui';
import { Avatar } from '@chakra-ui/avatar';
import { Button } from '@chakra-ui/button';
import { Spinner } from '@chakra-ui/spinner';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import { useToast } from '@chakra-ui/toast';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import Select from '@/components/Select';

interface IJobMarket {
  user: IUser,
  isAuthenticated: boolean,
  location_info: ILocationInfo,
  countries: ICountry[],
}

const JobMarket: React.FC<IJobMarket> = ({ user, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [country, setCountry] = useState(props.location_info.owner_id);

  const query = useQuery('getCountryJobOffers', () => {
    return request({
      url: `/api/markets/jobs?country_id=${country}`,
      method: 'GET',
      token: cookies.token,
    });
  });

  useEffect(() => { query.refetch() }, [country]);

  const mutation = useMutation(async ({ company_id, job_id }) => {
    let payload = { action: 'apply_job', data: { company_id, job_id } };

    let data = await request({
      url: '/api/me/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onMutate: ({ company_id, job_id }: { company_id: number, job_id: string }) => {},
    onSuccess: () => {
      showToast(toast, 'success', 'Job Application Successful');
      refreshData(router);
    },
    onError: () => {
      showToast(toast, 'error', 'Failed to Send Application');
    },
  });

  const canApplyForJob = (ceo: number): boolean => {
    return (!user.job || user.job === 0) && user._id !== ceo && user.country === props.location_info.owner_id;
  }

  const applyForJob = (company_id: number, job_id: string) => {
    mutation.mutate({ company_id, job_id });
  }

  return user ? (
    <Layout user={user}>
      <h1 className='flex justify-between pl-4 pr-8'>
        <span className='text-2xl font-semibold text-accent'>Job Market</span>
        <div>
          <Select onChange={(val) => setCountry(val as number)}>
            {props.countries.map((country, i) => (
              <Select.Option value={country._id} key={i}>{country.name}</Select.Option>
            ))}
          </Select>
        </div>
      </h1>
      <div className='mx-12 mt-4 p-2 bg-night rounded shadow-md'>
        {/* Job Offer Filters */}
        {query.isLoading && (
          <div className='w-full'>
            <Spinner className='flex justify-center items-center' colorScheme='red' />
          </div>
        )}
        {query.isSuccess && query.data?.jobOffers.length === 0 && (
          <p className='text-white'>Country has no job offers</p>
        )}
        {query.isSuccess && query.data?.jobOffers.length > 0 && (
          <Table bgColor='night' color='white'>
            <Thead>
              <Tr>
                <Th color='white'>Company</Th>
                <Th color='white'>Job Type</Th>
                <Th color='white'>Job Title</Th>
                <Th color='white'>Available Positions</Th>
                <Th color='white'>Wage</Th>
                <Th color='white'>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {query.data?.jobOffers.map((offer: IJobMarketOffer, i: number) => (
                <Tr key={i}>
                  <Td className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/company/${offer.company.id}`)}>
                    <Avatar src={offer.company.image} name={offer.company.name} />
                    {offer.company.name}
                  </Td>
                  <Td>
                    <i
                      className={COMPANY_TYPES[offer.company.type].css}
                      title={COMPANY_TYPES[offer.company.type].text}
                    />
                  </Td>
                  <Td>{offer.title}</Td>
                  <Td>{offer.quantity}</Td>
                  <Td>{offer.wage.toFixed(2)} {query.data?.cc}</Td>
                  <Td>
                    <Button
                      variant='solid'
                      colorScheme='green'
                      isDisabled={!canApplyForJob(offer.company.ceo)}
                      onClick={() => applyForJob(offer.company.id, offer.id)}
                    >
                      Apply
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
  const { req, res } = ctx;

  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    res.writeHead(302, {
      Location: '/login',
    });
    res.end();
    return;
  }

  // Get Location Info
  let location: IRegion = await Region.findOne({ _id: result.user.location }).exec();
  let owner: ICountry = await Country.findOne({ _id: location.owner }).exec();

  let location_info: ILocationInfo = {
    owner_id: owner._id,
    owner_name: owner.name,
    owner_flag: owner.flag_code,
    region_name: location.name,
  };

  // Get Countries
  let countries: ICountry[] = await Country.find({}).exec();

  return {
    props: {
      ...result,
      location_info: jsonify(location_info),
      countries: jsonify(countries),
    },
  };
}

export default JobMarket;