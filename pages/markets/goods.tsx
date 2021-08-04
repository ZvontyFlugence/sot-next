import Layout from '@/components/Layout';
import { IUser } from '@/models/User';
import Country, { ICountry } from '@/models/Country';
import { destroyCookie, parseCookies } from 'nookies';
import { getCurrentUser } from '@/util/auth';
import Select from '@/components/Select';
import { IGoodsMarketOffer, jsonify, roundMoney } from '@/util/apiHelpers';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@chakra-ui/toast';
import { refreshData, request, showToast } from '@/util/ui';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Spinner } from '@chakra-ui/spinner';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import { Avatar } from '@chakra-ui/avatar';
import { COMPANY_TYPES, ITEMS } from '@/util/constants';
import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/modal';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';

interface IGoodsMarket {
  user: IUser,
  isAuthenticated: boolean,
  countries: ICountry[],
}

const GoodsMarket: React.FC<IGoodsMarket> = ({ user, ...props }) => {
  const cookies = parseCookies();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [country, setCountry] = useState(user?.country);
  const [selected, setSelected] = useState<IGoodsMarketOffer>(null);
  const [quantity, setQuantity] = useState(1);

  const query = useQuery('getCountryProductOffers', () => {
    return request({
      url: `/api/markets/goods?country_id=${country}`,
      method: 'GET',
      token: cookies.token,
    });
  });

  useEffect(() => { query.refetch() }, [country]);

  const purchaseMutation = useMutation(async () => {
    let payload = { action: 'buy_item', data: { company_id: selected?.company.id, offer_id: selected?.id, quantity } };
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
    onSuccess: (data) => {
      showToast(toast, 'success', 'Successful Purchase', data?.message);
      queryClient.invalidateQueries('getWalletInfo');
      queryClient.invalidateQueries('getCountryProductOffers');
      refreshData(router);
    },
    onError: (e: Error) => {
      showToast(toast, 'error', 'Purchase Failed', e.message);
    },
  });

  const handlePurchase = () => {
    purchaseMutation.mutate();
  }

  const handleOpen = (offer: IGoodsMarketOffer) => {
    setSelected(offer);
    onOpen();
  }

  const handleClose = () => {
    setSelected(null);
    setQuantity(1);
    onClose();
  }

  const canPurchase = () => {
    return user.wallet.find(cc => cc.currency === query.data?.cc).amount < roundMoney(quantity * selected.price);
  }

  return user ? (
    <Layout user={user}>
      <h1 className='flex justify-between pl-4 pr-8'>
        <span className='text-2xl font-semibold text-accent'>Goods Market</span>
        <div>
          <Select onChange={(val) => setCountry(val as number)}>
            {props.countries.map((country, i) => (
              <Select.Option key={i} value={country._id}>
                {country.name}
                <i className={`ml-2 flag-icon flag-icon-${country.flag_code}`} />
              </Select.Option>
            ))}
          </Select>
        </div>
      </h1>
      <div className='mx-12 mt-4 p-2 bg-night rounded shadow-md'>
        {/* Product Offer Filters */}
        {query.isLoading && (
          <div className='w-full'>
            <Spinner className='flex justify-center items-center' color='accent' />
          </div>
        )}
        {query.isSuccess && query.data?.productOffers.length === 0 && (
          <p className='text-white'>Country has no product offers</p>
        )}
        {query.isSuccess && query.data?.productOffers.length > 0 && (
          <Table variant='unstyled' bgColor='night' color='white'>
            <Thead>
              <Tr>
                <Th color='white'>Company</Th>
                <Th color='white'>Product</Th>
                <Th color='white'>Quantity</Th>
                <Th color='white'>Price</Th>
                <Th color='white'>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {query.data?.productOffers.map((offer: IGoodsMarketOffer, i: number) => (
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
                  <Td>{offer.quantity}</Td>
                  <Td>{offer.price.toFixed(2)} {query.data?.cc}</Td>
                  <Td>
                    <Button
                      variant='solid'
                      colorScheme='green'
                      onClick={() => handleOpen(offer)}
                    >
                      Buy
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
      {selected && (
        <Modal isOpen={isOpen} onClose={handleClose}>
          <ModalOverlay />
          <ModalContent bgColor='night' color='white'>
            <ModalHeader className='h-brand text-accent'>Purchase Items</ModalHeader>
            <ModalCloseButton />
            <ModalBody className='flex flex-col gap-2'>
              <p className='mx-auto'>
                Buy {quantity} <i className={ITEMS[selected.product_id].image} /> for {(quantity * selected.price).toFixed(2)} {query.data?.cc}?
              </p>
              <FormControl>
                <FormLabel>Quantity</FormLabel>
                <Input
                  type='number'
                  min={1}
                  max={selected.quantity}
                  value={quantity}
                  isInvalid={canPurchase()}
                  onChange={e => setQuantity(e.target.valueAsNumber)} />
              </FormControl>
            </ModalBody>
            <ModalFooter className='flex gap-4'>
              <Button
                variant='solid'
                colorScheme={canPurchase() ? 'red' : 'blue'}
                isDisabled={canPurchase()}
                onClick={handlePurchase}
              >
                Purchase
              </Button>
              <Button variant='outline' _hover={{ bg: 'white', color: 'night' }} onClick={handleClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
  const { req, res } = ctx;

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

  // Get Countries
  let countries: ICountry[] = await Country.find({}).exec();

  return {
    props: {
      ...result,
      countries: jsonify(countries),
    },
  };
}

export default GoodsMarket;