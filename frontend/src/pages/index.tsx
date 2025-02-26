import { useState } from 'react';
import { Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Text, SimpleGrid } from '@chakra-ui/react';
import TokenWrapForm from '../components/TokenWrapForm';
import TokenUnwrapForm from '../components/TokenUnwrapForm';
import WrappedTokensList from '../components/WrappedTokensList';
import { TokenType } from '../types/contract';
import { useWallet } from '../hooks/useWallet';

export default function Home() {
  const { isConnected } = useWallet();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>('ERC20');

  const handleTabChange = (index: number) => {
    setSelectedTabIndex(index);
    
    // First two tabs are for wrapping and default to ERC20
    if (index <= 1) {
      setSelectedTokenType('ERC20');
    }
  };

  // Token type selector tabs for wrapping
  const renderTokenTypeTabs = () => (
    <Tabs size="sm" variant="soft-rounded" colorScheme="sei" onChange={(index) => setSelectedTokenType(index === 0 ? 'ERC20' : 'CW20')}>
      <TabList>
        <Tab>ERC20</Tab>
        <Tab>CW20</Tab>
      </TabList>
    </Tabs>
  );

  return (
    <Box>
      <Heading as="h1" size="xl" mb={6}>Sei Token Wrapper</Heading>
      
      {!isConnected ? (
        <Box 
          p={8} 
          bg="white" 
          borderRadius="lg" 
          boxShadow="md" 
          textAlign="center"
        >
          <Text fontSize="lg">Connect your wallet to get started</Text>
        </Box>
      ) : (
        <Tabs 
          variant="line" 
          colorScheme="sei" 
          index={selectedTabIndex} 
          onChange={handleTabChange}
        >
          <TabList>
            <Tab>Wrap</Tab>
            <Tab>Unwrap</Tab>
            <Tab>My Tokens</Tab>
          </TabList>

          <TabPanels>
            {/* Wrap Tab */}
            <TabPanel>
              <Box mb={4}>
                {renderTokenTypeTabs()}
              </Box>
              <TokenWrapForm tokenType={selectedTokenType} />
            </TabPanel>

            {/* Unwrap Tab */}
            <TabPanel>
              <TokenUnwrapForm />
            </TabPanel>

            {/* My Tokens Tab */}
            <TabPanel>
              <WrappedTokensList />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {/* Features Section */}
      <Box mt={12}>
        <Heading as="h2" size="lg" mb={6}>Features</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
            <Heading as="h3" size="md" mb={3} color="sei.600">ERC20 Wrapping</Heading>
            <Text>Wrap your ERC20 tokens from EVM chains into native Sei tokens for seamless interoperability.</Text>
          </Box>
          <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
            <Heading as="h3" size="md" mb={3} color="sei.600">CW20 Wrapping</Heading>
            <Text>Convert CW20 tokens into Sei native tokens, unifying the token experience across ecosystems.</Text>
          </Box>
          <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
            <Heading as="h3" size="md" mb={3} color="sei.600">Unified Interface</Heading>
            <Text>One contract to manage both token standards, simplifying the user experience.</Text>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}