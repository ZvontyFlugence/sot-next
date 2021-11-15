import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from 'react-query';

import colors from '../util/theme';
import 'flag-icon-css/css/flag-icon.min.css';
import 'react-contexify/dist/ReactContexify.css';
import 'react-quill/dist/quill.snow.css';

import '../styles/globals.css';
import MaintenancePage from './maintenance';
import { GetStaticProps } from 'next';

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
          {process.env.NEXT_PUBLIC_GMAP_KEY && (
            <script id='googleMaps' src={`/api/gmap/maps/api/js?key=${process.env.NEXT_PUBLIC_GMAP_KEY}`} defer></script>
          )}
        </Head>
        {(typeof pageProps.MAINTENANCE_MODE === 'boolean' && pageProps.MAINTENANCE_MODE === true) || pageProps.MAINTENANCE_MODE === 'true' ? (
          <MaintenancePage />
        ) : (
          <Component {...pageProps} />
        )}      
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE,
    },
  };
}

export default MyApp;
