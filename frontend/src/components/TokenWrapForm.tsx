import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  useToast,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useWallet } from '../hooks/useWallet';
import { testnetTokens } from '../config';
import { TokenType } from '../types/contract';
import { toContractAmount, hexToBytes, bytesToBase64 } from '../utils/format';

interface TokenWrapFormProps {
  tokenType: TokenType;
}

const TokenWrapForm: React.FC<TokenWrapFormProps> = ({ tokenType }) => {
  const { address, executeContract } = useWallet();
  const toast = useToast();

  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [evmSender, setEvmSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter tokens by type
  const filteredTokens = testnetTokens.filter(token => token.type === tokenType);

  const handleTokenSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(event.target.value);
    setError(null);
  };

  const handleWrap = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!selectedToken) {
        throw new Error('Please select a token');
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const token = testnetTokens.find(t => t.address === selectedToken);
      if (!token) {
        throw new Error('Token not found');
      }

      if (tokenType === 'ERC20') {
        // For ERC20, we need the EVM sender address
        if (!evmSender || !evmSender.startsWith('0x')) {
          throw new Error('Please enter a valid EVM address starting with 0x');
        }
        
        // Convert hex to bytes and then to base64 for contract
        const evmSenderBytes = hexToBytes(evmSender);
        const evmSenderBase64 = bytesToBase64(evmSenderBytes);
        
        // Prepare recipient if provided
        let recipientAddr = undefined;
        if (recipient) {
          recipientAddr = recipient;
        }
        
        // Execute wrap message
        const msg = {
          wrap_erc20: {
            evm_sender: evmSenderBase64,
            token_addr: token.address,
            amount: toContractAmount(amount, token.decimals),
            recipient: recipientAddr,
          }
        };
        
        const result = await executeContract(msg);
        
        toast({
          title: 'Token Wrapped',
          description: `Successfully wrapped ${amount} ${token.symbol}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reset form
        setAmount('');
        setEvmSender('');
        setRecipient('');
      } else if (tokenType === 'CW20') {
        // For CW20, we need to call the CW20 contract directly
        // First, encode the recipient if provided
        let recipientMsg = '';
        if (recipient) {
          recipientMsg = recipient;
        }
        
        // Convert recipient to base64 if provided
        const encodedMsg = recipient ? btoa(recipientMsg) : '';
        
        // Execute CW20 send message
        const msg = {
          send: {
            contract: token.address,
            amount: toContractAmount(amount, token.decimals),
            msg: encodedMsg,
          }
        };
        
        const result = await executeContract(msg);
        
        toast({
          title: 'Token Wrapped',
          description: `Successfully wrapped ${amount} ${token.symbol}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reset form
        setAmount('');
        setRecipient('');
      }
    } catch (err: any) {
      console.error('Error wrapping token:', err);
      setError(err.message || 'Failed to wrap token');
      toast({
        title: 'Error',
        description: err.message || 'Failed to wrap token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="flex-start">
        <Text fontSize="xl" fontWeight="bold">Wrap {tokenType} Tokens</Text>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <FormControl isRequired>
          <FormLabel>Select Token</FormLabel>
          <Select 
            placeholder="Select token" 
            value={selectedToken}
            onChange={handleTokenSelect}
          >
            {filteredTokens.map(token => (
              <option key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Amount</FormLabel>
          <Input 
            type="number" 
            placeholder="Enter amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormControl>
        
        {tokenType === 'ERC20' && (
          <FormControl isRequired>
            <FormLabel>EVM Sender Address</FormLabel>
            <Input 
              placeholder="0x..." 
              value={evmSender}
              onChange={(e) => setEvmSender(e.target.value)}
            />
          </FormControl>
        )}
        
        <FormControl>
          <FormLabel>Recipient Address (Optional)</FormLabel>
          <Input 
            placeholder={`Default: Your address (${address ? address.substring(0, 8) + '...' : ''})`}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            Leave empty to send tokens to your wallet
          </Text>
        </FormControl>
        
        <Button 
          colorScheme="sei" 
          size="lg" 
          width="full"
          onClick={handleWrap}
          isLoading={isLoading}
          loadingText="Wrapping..."
          mt={2}
        >
          Wrap Tokens
        </Button>
      </VStack>
    </Box>
  );
};

export default TokenWrapForm;