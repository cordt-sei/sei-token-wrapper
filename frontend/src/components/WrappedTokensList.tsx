import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  useToast,
  useClipboard,
  Tooltip,
} from '@chakra-ui/react';
import { useWallet } from '../hooks/useWallet';
import { TokenType } from '../types/contract';
import { formatTokenAmount, formatDenom, truncateAddress } from '../utils/format';
import { useQuery } from 'react-query';

interface WrappedToken {
  denom: string;
  balance: string;
  tokenType: TokenType;
  originalAddress: string;
}

const WrappedTokensList: React.FC = () => {
  const { address, client, queryContract } = useWallet();
  const toast = useToast();

  // Fetch user balances
  const { data: balances, isLoading, error } = useQuery(
    ['balances', address],
    async () => {
      if (!client || !address) return [];
      
      // Get all balances for the user
      const balanceResponse = await client.getAllBalances(address);
      
      // Filter for factory tokens
      const wrappedBalances = balanceResponse.filter(coin => 
        coin.denom.startsWith('factory/')
      );
      
      // Get token info for each balance
      const wrappedTokens: WrappedToken[] = [];
      
      for (const coin of wrappedBalances) {
        try {
          // Query token info from contract
          const tokenInfo = await queryContract({
            token_info: {
              denom: coin.denom
            }
          });
          
          wrappedTokens.push({
            denom: coin.denom,
            balance: coin.amount,
            tokenType: tokenInfo.token_type,
            originalAddress: tokenInfo.address
          });
        } catch (err) {
          console.error('Error fetching token info for', coin.denom, err);
        }
      }
      
      return wrappedTokens;
    },
    {
      enabled: !!client && !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Copy address to clipboard
  const { hasCopied, onCopy } = useClipboard("");
  
  const handleCopyAddress = (address: string) => {
    const { onCopy } = useClipboard(address);
    onCopy();
    toast({
      title: "Address copied",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" p={8}>
        <Spinner size="xl" color="sei.500" thickness="4px" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        Error loading wrapped tokens
      </Alert>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        You don't have any wrapped tokens in your wallet
      </Alert>
    );
  }

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
      <Text fontSize="xl" fontWeight="bold" mb={4}>Your Wrapped Tokens</Text>
      
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Token</Th>
              <Th>Balance</Th>
              <Th>Type</Th>
              <Th>Original Address</Th>
            </Tr>
          </Thead>
          <Tbody>
            {balances.map((token) => (
              <Tr key={token.denom}>
                <Td>
                  <Text fontWeight="medium">{formatDenom(token.denom)}</Text>
                  <Text fontSize="xs" color="gray.500">{token.denom}</Text>
                </Td>
                <Td>{formatTokenAmount(token.balance, 6)}</Td>
                <Td>
                  <Badge 
                    colorScheme={token.tokenType === 'ERC20' ? 'purple' : 'green'}
                  >
                    {token.tokenType}
                  </Badge>
                </Td>
                <Td>
                  <Tooltip label="Click to copy address">
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => handleCopyAddress(token.originalAddress)}
                      color="gray.600"
                    >
                      {truncateAddress(token.originalAddress, 8, 6)}
                    </Button>
                  </Tooltip>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default WrappedTokensList;