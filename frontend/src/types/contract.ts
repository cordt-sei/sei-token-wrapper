export type TokenType = 'ERC20' | 'CW20';

export interface TokenInfo {
  token_type: TokenType;
  address: string;
  wrapped_denom: string;
}

// Execute Messages
export interface WrapERC20Msg {
  wrap_erc20: {
    evm_sender: string;
    recipient?: string;
    token_addr: string;
    amount: string;
  };
}

export interface ReceiveMsg {
  receive: {
    sender: string;
    amount: string;
    msg: string;
  };
}

export interface UnwrapMsg {
  unwrap: {
    token_type: TokenType;
    evm_recipient?: string;
    cosmos_recipient?: string;
  };
}

// Query Messages
export interface TokenInfoQuery {
  token_info: {
    denom: string;
  };
}

export interface WrappedDenomQuery {
  wrapped_denom: {
    token_type: TokenType;
    token_address: string;
  };
}

export interface ListWrappedTokensQuery {
  list_wrapped_tokens: {
    start_after?: string;
    limit?: number;
  };
}

// Query Responses
export interface TokenInfoResponse {
  token_type: TokenType;
  address: string;
  wrapped_denom: string;
}

export interface WrappedDenomResponse {
  denom: string;
}

export interface ListWrappedTokensResponse {
  tokens: TokenInfo[];
}