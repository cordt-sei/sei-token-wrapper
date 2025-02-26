import type { AppProps } from 'next/app';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from '../components/Layout';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 30000,
    },
  },
});

// Customize Chakra UI theme
const theme = extendTheme({
  colors: {
    sei: {
      50: '#e6f7ff',
      100: '#bae3ff',
      500: '#00a0ff',
      600: '#0080cc',
      700: '#006099',
      900: '#003047',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
      },
      variants: {
        primary: {
          bg: 'sei.500',
          color: 'white',
          _hover: {
            bg: 'sei.600',
          },
        },
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </QueryClientProvider>
  );
}