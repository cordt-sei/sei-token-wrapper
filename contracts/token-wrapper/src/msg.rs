use cosmwasm_schema::QueryResponses;
use cosmwasm_std::{Addr, Binary, Uint128};

#[cosmwasm_schema::cw_serde]
pub enum TokenType {
    ERC20,
    CW20,
}

#[cosmwasm_schema::cw_serde]
pub struct TokenInfo {
    pub token_type: TokenType,
    pub address: String,
    pub wrapped_denom: String,
}

#[cosmwasm_schema::cw_serde]
pub enum TokenWrapperExecMsg {
    // For CW20 tokens
    Receive(cw20::Cw20ReceiveMsg),
    
    // For ERC20 tokens
    WrapERC20 {
        evm_sender: Binary,
        recipient: Option<Addr>,
        token_addr: String,
        amount: Uint128,
    },
    
    // Unwrap operations
    Unwrap {
        token_type: TokenType,
        evm_recipient: Option<Binary>,
        cosmos_recipient: Option<Addr>,
    },
}

#[cosmwasm_schema::cw_serde]
#[derive(QueryResponses)]
pub enum TokenWrapperQueryMsg {
    #[returns(TokenInfo)]
    TokenInfo { denom: String },
    
    #[returns(String)]
    WrappedDenom { 
        token_type: TokenType,
        token_address: String,
    },
    
    #[returns(Vec<TokenInfo>)]
    ListWrappedTokens {
        start_after: Option<String>,
        limit: Option<u32>,
    },
}

// Used for contract instantiation
#[cosmwasm_schema::cw_serde]
pub struct InstantiateMsg {}

// Used for contract migration
#[cosmwasm_schema::cw_serde]
pub struct MigrateMsg {}