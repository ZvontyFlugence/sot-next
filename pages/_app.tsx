import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Head from 'next/head';

import colors from '../util/theme';
import 'react-contexify/dist/ReactContexify.css';
import 'react-quill/dist/quill.snow.css';

import '../styles/globals.css';
import MaintenancePage from './maintenance';
import { GetServerSideProps } from 'next';
import { UserContextProvider } from '@/context/UserContext';
import { destroyCookie } from 'nookies';
import { getCurrentUser } from '@/util/auth';

const theme = extendTheme({ colors });

function MyApp({ Component, pageProps }) {
  return (
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
        <UserContextProvider fallback={pageProps.fallback}>
          <Component {...pageProps} />
        </UserContextProvider>
      )}      
    </ChakraProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let result = await getCurrentUser(context.req);

  if (!result.isAuthenticated) {
    destroyCookie(context, 'token');
  }
  
  return {
    props: {
      MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE,
      fallback: {
        '/api/me': result.user,
      }
    },
  };
}

export default MyApp;
