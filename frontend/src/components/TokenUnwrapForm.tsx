import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Text,
  VStack,
  Alert,
  AlertIcon,
  useToast,
  RadioGroup,
  Radio,
  Stack,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useWallet } from '../hooks/useWallet';
import { TokenType } from '../types/contract';
import { toContractAmount, hexToBytes, bytesToBase64, formatTokenAmount } from '../utils/format';
import { useQuery } from 'react-query';

interface WrappedToken {
  denom: string;
  balance: string;
  tokenType: TokenType;
  originalAddress: string;
}

const TokenUnwrapForm: React.FC = () => {
  const { address, executeContract, client, queryContract } = useWallet();
  const toast = useToast();

  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>('ERC20');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalances, setUserBalances] = useState<WrappedToken[]>([]);

  // Fetch user balances
  const { data: balances, isLoading: isLoadingBalances, refetch: refetchBalances } = useQuery(
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
          console.error('Error fetching token info', err);
        }
      }
      
      return wrappedTokens;
    },
    {
      enabled: !!client && !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  useEffect(() => {
    if (balances) {
      setUserBalances(balances);
    }
  }, [balances]);

  const handleTokenSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const denom = event.target.value;
    setSelectedToken(denom);
    
    // Set token type based on selected token
    const token = userBalances.find(t => t.denom === denom);
    if (token) {
      setSelectedTokenType(token.tokenType);
    }
    
    setError(null);
  };

  const handleUnwrap = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!selectedToken) {
        throw new Error('Please select a token');
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const token = userBalances.find(t => t.denom === selectedToken);
      if (!token) {
        throw new Error('Token not found');
      }

      // For ERC20, validate EVM address
      if (selectedTokenType === 'ERC20' && (!recipient || !recipient.startsWith('0x'))) {
        throw new Error('Please enter a valid EVM address starting with 0x');
      }
      
      // For CW20, validate Cosmos address
      if (selectedTokenType === 'CW20' && (!recipient || !recipient.startsWith('sei'))) {
        throw new Error('Please enter a valid Sei address starting with sei');
      }

      // Prepare unwrap message
      let msg;
      if (selectedTokenType === 'ERC20') {
        // Convert hex to bytes and then to base64 for contract
        const evmRecipientBytes = hexToBytes(recipient);
        const evmRecipientBase64 = bytesToBase64(evmRecipientBytes);
        
        msg = {
          unwrap: {
            token_type: 'ERC20',
            evm_recipient: evmRecipientBase64,
            cosmos_recipient: null
          }
        };
      } else {
        msg = {
          unwrap: {
            token_type: 'CW20',
            evm_recipient: null,
            cosmos_recipient: recipient
          }
        };
      }
      
      // Convert amount to contract format
      const contractAmount = toContractAmount(amount, 6); // Assuming 6 decimals for wrapped tokens
      
      // Execute unwrap with funds
      const result = await executeContract(msg, [
        { denom: selectedToken, amount: contractAmount }
      ]);
      
      toast({
        title: 'Token Unwrapped',
        description: `Successfully unwrapped ${amount} tokens`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form and refetch balances
      setAmount('');
      setRecipient('');
      refetchBalances();
      
    } catch (err: any) {
      console.error('Error unwrapping token:', err);
      setError(err.message || 'Failed to unwrap token');
      toast({
        title: 'Error',
        description: err.message || 'Failed to unwrap token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxBalance = () => {
    const token = userBalances.find(t => t.denom === selectedToken);
    if (token) {
      return formatTokenAmount(token.balance, 6);
    }
    return '0';
  };

  const setMaxAmount = () => {
    setAmount(getMaxBalance());
  };

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="flex-start">
        <Text fontSize="xl" fontWeight="bold">Unwrap Tokens</Text>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <FormControl isRequired>
          <FormLabel>Select Token</FormLabel>
          <Select 
            placeholder={isLoadingBalances ? "Loading tokens..." : "Select wrapped token"} 
            value={selectedToken}
            onChange={handleTokenSelect}
            isDisabled={isLoadingBalances || userBalances.length === 0}
          >
            {userBalances.map(token => (
              <option key={token.denom} value={token.denom}>
                {formatTokenAmount(token.balance, 6)} {token.denom.split('/')[2]} ({token.tokenType})
              </option>
            ))}
          </Select>
          {userBalances.length === 0 && !isLoadingBalances && (
            <Text fontSize="sm" color="orange.500" mt={1}>
              No wrapped tokens found in your wallet
            </Text>
          )}
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Amount</FormLabel>
          <InputGroup>
            <Input 
              type="number" 
              placeholder="Enter amount" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              isDisabled={!selectedToken}
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={setMaxAmount}>
                Max
              </Button>
            </InputRightElement>
          </InputGroup>
          {selectedToken && (
            <Text fontSize="xs" color="gray.500" mt={1}>
              Balance: {getMaxBalance()}
            </Text>
          )}
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>
            Recipient Address ({selectedTokenType === 'ERC20' ? 'EVM Address' : 'Sei Address'})
          </FormLabel>
          <Input 
            placeholder={selectedTokenType === 'ERC20' ? "0x..." : "sei..."}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            isDisabled={!selectedToken}
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            {selectedTokenType === 'ERC20' 
              ? 'EVM address where tokens will be sent'
              : 'Sei address where tokens will be sent'}
          </Text>
        </FormControl>
        
        <Button 
          colorScheme="sei" 
          size="lg" 
          width="full"
          onClick={handleUnwrap}
          isLoading={isLoading}
          loadingText="Unwrapping..."
          isDisabled={!selectedToken || !amount || !recipient}
          mt={2}
        >
          Unwrap Tokens
        </Button>
      </VStack>
    </Box>
  );
};

export default TokenUnwrapForm;