import Layout from "@/components/Layout";
import { EconomicStance, SocialStance } from "@/models/Party";
import { IUser } from "@/models/User";
import { roundMoney } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { request, showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@chakra-ui/slider";
import { useToast } from "@chakra-ui/toast";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from "nookies";
import { useState } from "react";

interface ICreatePartyProps {
  user: IUser,
  isAuthenticated: boolean,
}

const CreateParty: React.FC<ICreatePartyProps> = ({ user, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [econStance, setEconStance] = useState<number>(0);
  const [socStance, setSocStance] = useState<number>(0);

  const hasSufficientFunds: boolean = (user && roundMoney(user.gold) > 5) || false;

  const handleCreateParty = () => {
    let payload = {
      name,
      color,
      economicStance: econStance,
      socialStance: socStance,
    };

    request({  
      url: '/api/parties/',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        router.push(`/party/${data?.partyId}`);
      } else {
        showToast(toast, 'error', 'Create Party Failed', data?.error);
      }
    });
  }

  return user ? (
    <Layout user={user}>
      <h1 className='text-2xl text-accent'>Create Political Party</h1>
      <div className='flex flex-col items-center justify-center gap-8'>
        <div className='px-4 py-2 rounded shadow-md bg-blue-300 bg-opacity-50'>
          <p className='text-white'>You are not in a political party</p>
          <Button
            className='mt-2 mx-auto'
            size='sm'
            colorScheme='whiteAlpha'
            onClick={() => router.push(`/rankings/${user.country}/parties`)}
          >
            See Political Parties
          </Button>
        </div>
        <div className='flex flex-col items-center gap-2 px-4 py-2 bg-night rounded shadow-md text-white w-72'>
          <FormControl>
            <FormLabel>Party Name</FormLabel>
            <Input type='text' value={name} onChange={e => setName(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Party Color</FormLabel>
            <Input type='text' value={color} onChange={e => setColor(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Economic Stance</FormLabel>
            <p className='text-center'>{EconomicStance.toString(EconomicStance.valueOf(econStance))}</p>
            <Slider
              aria-label='econ-slider'
              defaultValue={0}
              min={-1.0}
              max={1.0}
              step={0.25}
              onChange={val => setEconStance(val)}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
          <FormControl>
            <FormLabel>Social Stance</FormLabel>
            <p className="text-center">{SocialStance.toString(SocialStance.valueOf(socStance))}</p>
            <Slider
              aria-label='soc-slider'
              defaultValue={0}
              min={-0.99}
              max={0.99}
              step={0.33}
              onChange={val => setSocStance(val)}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
          <p>Cost 15.00 <i className='sot-icon sot-coin' /></p>
          <Button
            size='sm'
            colorScheme={hasSufficientFunds ? 'green' : 'red'}
            disabled={!hasSufficientFunds}
            onClick={handleCreateParty}
          >
            Create Party
          </Button>
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  let { req } = ctx;

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

  return {
    props: { ...result },
  };
}

export default CreateParty;