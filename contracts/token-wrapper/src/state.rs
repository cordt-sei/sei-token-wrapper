use cosmwasm_std::Addr;
use cosmwasm_schema::cw_serde;
use cw_storage_plus::{Item, Map};

use crate::msg::TokenType;

#[cw_serde]
pub struct TokenRegistry {
    pub token_type: TokenType,
    pub token_address: String,  // ERC20 address or CW20 address
    pub wrapped_denom: String,
}

#[cw_serde]
pub struct Config {
    pub owner: Option<Addr>,
}

// Primary state - config, token registries
pub const CONFIG: Item<Config> = Item::new("config");

// Maps wrapped denom to token info
pub const TOKEN_INFO: Map<&str, TokenRegistry> = Map::new("token_info");

// Maps token address to wrapped denom for ERC20 tokens
pub const ERC20_TO_DENOM: Map<&str, String> = Map::new("erc20_to_denom");

// Maps token address to wrapped denom for CW20 tokens
pub const CW20_TO_DENOM: Map<&Addr, String> = Map::new("cw20_to_denom");

// Constants
pub const BASE32_ALGORITHM: base32::Alphabet = base32::Alphabet::Rfc4648Lower { padding: false };
pub const WRAP_EVM_CALL_ID: u64 = 2571182633660066190;
pub const UNWRAP_EVM_CALL_ID: u64 = 13078395618759265986;

// Utils
pub fn token_addr_to_subdenom(token_type: &TokenType, token_addr: &str) -> String {
    match token_type {
        TokenType::ERC20 => {
            // For ERC20, create a subdenom using "crwn" prefix and the token address
            let addr = if token_addr.starts_with("0x") {
                token_addr[2..].to_uppercase()
            } else {
                token_addr.to_uppercase()
            };
            format!("crwn{}", addr)
        },
        TokenType::CW20 => {
            // For CW20, use base32 encoding of the address
            let bytes = token_addr.as_bytes();
            let mut subdenom = base32::encode(BASE32_ALGORITHM, bytes);
            subdenom.truncate(44);
            subdenom
        }
    }
}