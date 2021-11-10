import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { ICountry } from '@/models/Country';
import Election, { ElectionType, ICandidate, IElection } from '@/models/Election';
import Party, { IParty } from '@/models/Party';
import { IUser } from '@/models/User';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { request } from '@/util/ui';
import { Avatar, Button, flexbox, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { useEffect, useState } from 'react';

interface IPPResults {
  user?: IUser,
  isAuthenticated: boolean,
  election: IElection,
  country: number,
}

const PPResults: React.FC<IPPResults> = ({ user, election, country, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState<number>(country);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [selectedParty, setSelectedParty] = useState<number>(election.typeId);
  const [parties, setParties] = useState<IParty[]>([]);

  useEffect(() => {
    request({
      url: `/api/countries/${selectedCountry}/parties`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.parties)
        setParties(
          data.parties.sort((a: IParty, b: IParty) => a.name.localeCompare(b.name))
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
      url: `/api/countries/${selectedCountry}/parties`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.parties)
        setParties(
          data.parties.sort((a: IParty, b: IParty) => a.name.localeCompare(b.name))
        );
    });
  }, [selectedCountry]);

  const goToElection = () => {
    router.push(`/election/party/${selectedParty}/${election.year}/${election.month}/results`);
  }

  return user ? (
    <Layout user={user}>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl text-accent font-semibold'>
          Party Election Results: {election?.month}/15/{election?.year}
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
          {selectedParty && parties.length > 0 && (
            <Select
              className='border border-white border-opacity-25 rounded shadow-md'
              selected={selectedParty}
              onChange={(val) => setSelectedParty(val as number)}
            >
              {parties.map((party: IParty, i: number) => (
                <Select.Option key={i} value={party._id}>
                  <Avatar src={party.image} name={party.name} />
                  {party.name}
                </Select.Option>
              ))}
            </Select>
          )}
          <Button size='sm' colorScheme='blue' onClick={goToElection}>Go</Button>
        </div>
      </div>
      <div className='mt-4 mr-8 p-4 bg-night rouded shadow-md text-white'>
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

export const getServerSideProps: GetServerSideProps = async ctx => {
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

  let partyId: number = Number.parseInt(params.partyId as string);
  let year: number = Number.parseInt(params.year as string);
  let month: number = Number.parseInt(params.month as string);

  let query = {
    type: ElectionType.PartyPresident,
    typeId: partyId,
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

  let party: IParty = await Party.findOne({ _id: election.typeId }).exec();

  return {
    props: {
      ...result,
      election: jsonify(election),
      country: jsonify(party.country),
    },
  };
}

export default PPResults;