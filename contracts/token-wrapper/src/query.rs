use cosmwasm_std::{Deps, Env, StdError, StdResult, Order};
use sei_cosmwasm::SeiQueryWrapper;
use cw_storage_plus::Bound;

use crate::msg::{TokenInfo, TokenType};
use crate::state::{TOKEN_INFO, ERC20_TO_DENOM, CW20_TO_DENOM, token_addr_to_subdenom};

// Default pagination limit
const DEFAULT_LIMIT: u32 = 10;
const MAX_LIMIT: u32 = 30;

pub fn token_info(
    deps: Deps<SeiQueryWrapper>,
    denom: String,
) -> StdResult<TokenInfo> {
    let registry = TOKEN_INFO.load(deps.storage, &denom)
        .map_err(|_| StdError::generic_err("Token not found"))?;
    
    Ok(TokenInfo {
        token_type: registry.token_type,
        address: registry.token_address,
        wrapped_denom: registry.wrapped_denom,
    })
}

pub fn wrapped_denom(
    deps: Deps<SeiQueryWrapper>, 
    env: Env,
    token_type: TokenType, 
    token_address: String
) -> StdResult<String> {
    match token_type {
        TokenType::ERC20 => {
            if let Some(denom) = ERC20_TO_DENOM.may_load(deps.storage, &token_address)? {
                return Ok(denom);
            }
        },
        TokenType::CW20 => {
            let addr = deps.api.addr_validate(&token_address)?;
            if let Some(denom) = CW20_TO_DENOM.may_load(deps.storage, &addr)? {
                return Ok(denom);
            }
        }
    }
    
    // If not found, compute what it would be
    let subdenom = token_addr_to_subdenom(&token_type, &token_address);
    let denom = format!("factory/{}/{}", env.contract.address, subdenom);
    Ok(denom)
}

pub fn list_wrapped_tokens(
    deps: Deps<SeiQueryWrapper>,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<TokenInfo>> {
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    
    let start = start_after.as_ref().map(|s| Bound::exclusive(s.as_str()));
    
    let tokens: Vec<TokenInfo> = TOKEN_INFO
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(|item| {
            let (_, registry) = item?;
            Ok(TokenInfo {
                token_type: registry.token_type,
                address: registry.token_address,
                wrapped_denom: registry.wrapped_denom,
            })
        })
        .collect::<StdResult<Vec<_>>>()?;
    
    Ok(tokens)
}