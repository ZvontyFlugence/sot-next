import Layout from '@/components/Layout';
import { ElectionSystem } from '@/models/Country';
import Election, { ECVote, ElectionType, ICandidate, IElection } from '@/models/Election';
import { IPath, IRegion } from '@/models/Region';
import { IUser } from '@/models/User';
import { UserActions } from '@/util/actions';
import { jsonify } from '@/util/apiHelpers';
import { getCurrentUser } from '@/util/auth';
import { MAP_STYLE } from '@/util/constants';
import { pSBC, refreshData, request, showToast } from '@/util/ui';
import { Table, Thead, Tr, Th, Tbody, Td, Avatar, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { destroyCookie, parseCookies } from 'nookies';
import { GMap } from 'primereact/gmap';
import React, { useEffect, useState } from 'react';

interface ICPElection {
  user?: IUser,
  isAuthenticated: boolean,
  election: IElection,
}

const CPElection: React.FC<ICPElection> = ({ user, election, ...props }) => {
  const router = useRouter();

  console.log('Election', election);

  const getCandidateResults = (candidateId: number) => {
    if (election?.tally && (election.winner as number) > -1) {
      return election?.tally[election.winner as number];
    } else {
      let candidateIndex: number = election.candidates.findIndex(can => can.id === candidateId);
      return (election.candidates[candidateIndex].votes as number[]).length;
    }
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-xl text-accent h-brand font-semibold'>
        Country President Election Results: {election?.month}/{election?.year}
      </h1>
      <div className='flex justify-center my-4'>
        <div className='px-4 py-2 rounded shadow-md bg-blue-300 bg-opacity-50 text-white'>
          {election.system === ElectionSystem.ElectoralCollege ? (
            <>
              <p className='font-semibold'>
                This election was conducted with an Electoral College system
              </p>
              <p>
                There may be a slight discrepancy in the total number of electoral votes due to rounding!
              </p>
            </>
          ) : (
            <p>This election was conducted with a Popular Vote system</p>
          )}
          
        </div>
      </div>
      <div className='mt-4 mr-8 p-4 bg-night rounded shadow-md text-white'>
        <h3 className='text-lg text-accent h-brand font-semibold'>Candidates</h3>
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
                  {getCandidateResults(can.id)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <ECResults
          country={election.typeId}
          election={election}
        />
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

  let country: number = Number.parseInt(params.countryId);
  let year: number = Number.parseInt(params.year);
  let month: number = Number.parseInt(params.month);

  let query = {
    isActive: false,
    isCompleted: true,
    type: ElectionType.CountryPresident,
    typeId: country,
    year,
    month,
  };

  let election: IElection = await Election.findOne(query).exec();
  if (!election) {
    return {
      redirect: {
        permanent: false,
        destination: '/dashboard',
      },
    };
  }

  return {
    props: {
      ...result,
      election: jsonify(election),
    }
  }
}

interface IECResults {
  country: number,
  election: IElection,
}

const ECResults: React.FC<IECResults> = ({ country, election }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [overlays, setOverlays] = useState([]);

  const options = {
    center: {
      lat: 37.72886323155891,
      lng: -97.86977002071538,
    },
    zoom: 4,
    disableDefaultUI: true,
    styles: MAP_STYLE,
  }

  const getRegionColor = (regionId: number): string => {
    if (election.system !== ElectionSystem.ElectoralCollege || !Object.keys(election?.ecResults).includes(`${regionId}`))
      return '#777777';

    // Get results from region
    let regionResults = election.ecResults && election.ecResults[regionId];
    
    // Calculate winning candidate
    let maxVotes: number = 0;
    let winner: number | null = null;
    if (regionResults) {
      for (let candidateIdStr in regionResults) {
        let candidateId: number = Number.parseInt(candidateIdStr);
        if (regionResults[candidateId] > maxVotes) {
          maxVotes = regionResults[candidateId];
          winner = candidateId;
        }
      }
    }

    if (!winner && election.winner === -1)
      return '#777777';
    else if (!winner && election.winner > 0) {
      let winnerIndex: number = election.candidates.findIndex(can => can.id === election.winner);
      return election.candidates[winnerIndex]?.partyColor;
    }

    // Get Candidate Party
    let candidateIndex: number = election.candidates.findIndex(can => can.id === winner);
    return election.candidates[candidateIndex]?.partyColor;
  }

  const displayRegionInfo = (region: IRegion) => {
    if (election.system !== ElectionSystem.ElectoralCollege) return;
    let regionResults = election?.ecResults[region._id];
    let results = [];

    if (regionResults) {
      for (let candidateId in regionResults) {
        let candidate = election.candidates.find(can => can.id === Number.parseInt(candidateId));
        if (candidate)
          results.push({ candidate, votes: regionResults[candidateId] });
      }
    }

    toast({
      position: 'top-right',
      status: 'info',
      title: (
        <span className='text-xl'>
          {region.name}
        </span>
      ),
      description: (
        <div className='mx-auto'>
          <div className='flex flex-col gap-4'>
            <div className='flex justify-between items-center'>
              Electoral College Votes: {election.regionTallies[region._id] ?? 0}
            </div>
            {results.length > 0 ? (
              results.map((result, i) => (
                <div key={i} className='flex items-center gap-8'>
                  <div className='flex items-center gap-2'>
                    <Avatar src={(result.candidate as ICandidate)?.image} name={(result.candidate as ICandidate)?.name} />
                    <span>{(result.candidate as ICandidate)?.name}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Avatar src={(result.candidate as ICandidate)?.partyImage} name={(result.candidate as ICandidate)?.partyName} />
                    {(result.votes * 100).toFixed(1)}%
                  </div>
                </div>
              ))
            ) : 'No Votes'}
          </div>
        </div>
      ),
      isClosable: false,
    });
  }

  useEffect(() => {
    request({
      url: `/api/countries/${country}/regions`,
      method: 'GET',
      token: cookies.token,
    }).then(data => {
      if (data.regions) {
        setOverlays(data.regions.map((region: IRegion) => {
          let paths: IPath[] | IPath[][] = [];
          if (!region.type)
            paths = (region.borders as IPath[]).map((path: IPath) => ({ lat: path.lng, lng: path.lat }));
          else
            paths = (region.borders as IPath[][]).map((geom: IPath[]) => {
              return geom.map((path: IPath) => ({ lat: path.lng, lng: path.lat }));
            });

          const color: string = getRegionColor(region._id);
          let polygon = new google.maps.Polygon({ paths, strokeWeight: 1, fillColor: color, fillOpacity: 0.9 });
          polygon.addListener('click', () => router.push(`/region/${region._id}`));
          polygon.addListener('mouseover', () => {
            displayRegionInfo(region);

            // Highlist
            polygon.setOptions({ fillColor: pSBC(0.3, color) });
          });
          polygon.addListener('mouseout', () => {
            toast.closeAll();
            polygon.setOptions({ fillColor: color });
          });

          return polygon;
        }));
      }
    });
  }, [country, election]);

  return election.system === ElectionSystem.ElectoralCollege ? (
    <div id='world' className='mt-4'>
      <h3 className='text-lg text-accent font-semibold'>Electoral College Results</h3>
      <div>
        <GMap
          overlays={overlays}
          options={options}
          style={{ width: '100%', minHeight: '500px' }}
        />
      </div>
    </div>
  ) : (<></>);
}

export default CPElection;