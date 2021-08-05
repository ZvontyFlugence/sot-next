import { useEffect, useState } from "react";
import Layout from '@/components/Layout';
import Select from "@/components/Select";
import { ICountry } from "@/models/Country";
import Election, { ElectionType, ICandidate, IElection } from "@/models/Election";
import Region, { IRegion } from "@/models/Region";
import { IUser } from '@/models/User';
import { UserActions } from "@/util/actions";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from '@/util/auth';
import { request } from "@/util/ui";
import { Avatar, Button, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from "nookies";

interface ICongressResults {
  user?: IUser,
  isAuthenticated: boolean,
  election: IElection,
  country: number,
}

const CongressResults: React.FC<ICongressResults> = ({ user, election, country, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState<number>(country);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<number>(election.typeId);
  const [regions, setRegions] = useState<IRegion[]>([]);

  useEffect(() => {
    request({
      url: `/api/countries/${selectedCountry}/regions`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.regions)
        setRegions(
          data.regions.sort((a: IRegion, b: IRegion) => a.name.localeCompare(b.name))
        );
    });

    request({
      url: '/api/countries',
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.countries)
        setCountries(
          data.countries.sort((a: ICountry, b: ICountry) => a.name.localeCompare(b.name))
        );
    });
  }, []);

  useEffect(() => {
    request({
      url: `/api/countries/${selectedCountry}/regions`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.regions)
        setRegions(
          data.regions.sort((a: IRegion, b: IRegion) => a.name.localeCompare(b.name))
        );
    });
  }, [selectedCountry]);

  const goToElection = () => {
    router.push(`/election/congress/${selectedRegion}/${election.year}/${election.month}`);
  }

  return user ? (
    <Layout user={user}>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl text-accent font-semibold'>
          Congress Election Results: {election?.month}/25/${election?.year}
        </h1>
        <div className='flex items-center gap-4 pr-8'>
          {countries.length > 0 && (
            <Select
              className='border border-white border-opacity-25 rounded shadow-md'
              selected={selectedCountry}
              onChange={(val) => setSelectedCountry(val as number)}
            >
              {countries.map((country: ICountry, i: number) => (
                <Select.Option key={i} value={country._id}>
                  {country.name}
                  <i className={`ml-2 flag-icon flag-icon-${country.flag_code} rounded shadow-md`} />
                </Select.Option>
              ))}
            </Select>
          )}
          {selectedRegion && regions.length > 0 && (
            <Select
              className='border border-white border-opacity-25 rounded shadow-md'
              selected={selectedRegion}
              onChange={(val) => setSelectedRegion(val as number)}
            >
              {regions.map((region: IRegion, i: number) => (
                <Select.Option key={i} value={region._id}>
                  {region.name}
                </Select.Option>
              ))}
            </Select>
          )}
          <Button size='sm' colorScheme='blue' onClick={goToElection}>Go</Button>
        </div>
      </div>
      <div className='mt-4 mr-8 p-4 bg-night rounded shadow-md text-white'>
        <h3 className='text-lg text-accent font-semibold'>Candidates</h3>
        <Table>
          <Thead>
            <Tr>
              <Th color='white'>Candidate</Th>
              <Th color='white'>Party</Th>
              <Th color='white'>Votes</Th>
            </Tr>
          </Thead>
          <Tbody>
            {election?.candidates.map((can: ICandidate, i: number) => (
              <Tr key={i}>
                <Td>
                  <div className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/profile/${can.id}`)}>
                    <Avatar src={can.image} name={can.name} />
                    <span>{can.name}</span>
                  </div>
                </Td>
                <Td>
                  <div className='flex items-center gap-4 cursor-pointer' onClick={() => router.push(`/party/${can.party}`)}>
                    <Avatar src={can.partyImage} name={can.partyName} />
                    <span>{can.partyName}</span>
                  </div>
                </Td>
                <Td>
                  {(can.votes as number[]).length}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
  let { req, params } = ctx;
  let result = await getCurrentUser(req);

  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let regionId: number = Number.parseInt(params.regionId);
  let year: number = Number.parseInt(params.year);
  let month: number = Number.parseInt(params.month);

  let query = {
    type: ElectionType.Congress,
    typeId: regionId,
    year,
    month,
  };

  let election: IElection = await Election.findOne(query).exec();
  if (!election || election.isActive || !election.isCompleted) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  let region: IRegion = await Region.findOne({ _id: election.typeId }).exec();

  return {
    props: {
      ...result,
      election: jsonify(election),
      country: jsonify(region.owner),
    },
  };
}

export default CongressResults;