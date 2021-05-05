import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from 'react-query';

import colors from '../util/theme';
import '../styles/globals.css';
import 'flag-icon-css/css/flag-icon.min.css';
import 'react-contexify/dist/ReactContexify.css';

const queryClient = new QueryClient();
const theme = extendTheme({ colors });

function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Head>
          <title>State of Turmoil</title>
          <link rel='icon' type='image/png' href='/favicon.png' />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link href="https://fonts.googleapis.com/css2?family=Unica+One&display=swap" rel="stylesheet" />
          <script id='googleMaps' src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GMAP_KEY}`}></script>
        </Head>
        <Component {...pageProps} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
