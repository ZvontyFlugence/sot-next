import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from 'react-query';

import colors from '../util/theme';
import 'tailwindcss/tailwind.css';
import '../styles/globals.css';
import 'flag-icon-css/css/flag-icon.min.css';

const queryClient = new QueryClient();
const theme = extendTheme({ colors });

function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Head>
          <title>State of Turmoil</title>
          <link rel='icon' type='image/svg' href='/SoT.svg' />
        </Head>
        <Component {...pageProps} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
