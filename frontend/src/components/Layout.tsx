import React from 'react';
import { Box, Container, Flex, Heading, Button, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/format';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { address, connect, disconnect, isConnected } = useWallet();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box as="header" bg={bgColor} borderBottom="1px" borderColor={borderColor} py={4} position="sticky" top={0} zIndex={10}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="md" color="sei.500">Sei Token Wrapper</Heading>
            
            {isConnected && address ? (
              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  {truncateAddress(address)}
                </Text>
                <Button size="sm" onClick={disconnect} variant="outline">
                  Disconnect
                </Button>
              </HStack>
            ) : (
              <Button size="sm" onClick={connect} variant="primary">
                Connect Wallet
              </Button>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>

      {/* Footer */}
      <Box as="footer" bg={bgColor} borderTop="1px" borderColor={borderColor} py={6} mt="auto">
        <Container maxW="container.xl">
          <Flex direction="column" align="center">
            <Text fontSize="sm" color="gray.500">
              Sei Token Wrapper © {new Date().getFullYear()}
            </Text>
            <Text fontSize="xs" color="gray.400" mt={1}>
              Running on Sei Atlantic-2 Testnet
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
                  Disconnect
                </Button>
              </HStack>
            ) : (
              <Button size="sm" onClick={connect} variant="primary">
                Connect Wallet
              </Button>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>

      {/* Footer */}
      <Box as="footer" bg={bgColor} borderTop="1px" borderColor={borderColor} py={6} mt="auto">
        <Container maxW="container.xl">
          <Flex direction="column" align="center">
            <Text fontSize="sm" color="gray.500">
              Sei Token Wrapper © {new Date().getFullYear()}
            </Text>
            <Text fontSize="xs" color="gray.400" mt={1}>
              Running on Sei Atlantic-2 Testnet
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;