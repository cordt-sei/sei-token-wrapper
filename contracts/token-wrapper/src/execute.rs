use cosmwasm_std::{
    BankMsg, Binary, Coin, CosmosMsg, DepsMut, Env, MessageInfo, ReplyOn, Response, SubMsg, to_json_binary,
    Uint128, WasmMsg, Addr,
};
use sei_cosmwasm::{SeiMsg, SeiQueryWrapper, SeiQuerier};
use cw_utils::nonpayable;

use crate::error::TokenWrapperError;
use crate::msg::TokenType;
use crate::state::{TOKEN_INFO, ERC20_TO_DENOM, CW20_TO_DENOM, token_addr_to_subdenom, TokenRegistry, WRAP_EVM_CALL_ID, UNWRAP_EVM_CALL_ID};

// ERC20 function signatures
const TRANSFER_SIG: &[u8] = b"\xa9\x05\x9c\xbb";
const TRANSFER_FROM_SIG: &[u8] = b"\x23\xb8\x72\xdd";

pub fn handle_cw20_receive(
    deps: DepsMut<SeiQueryWrapper>,
    env: Env,
    info: MessageInfo,
    cw20_msg: cw20::Cw20ReceiveMsg,
) -> Result<Response<SeiMsg>, TokenWrapperError> {
    // Verify the CW20 token sent some funds
    if cw20_msg.amount == Uint128::zero() {
        return Err(TokenWrapperError::UnfundedCall);
    }

    // Extract recipient - either explicitly provided in message or sender of the CW20 token
    let recipient_addr = match String::from_utf8(cw20_msg.msg.clone().to_vec()) {
        Ok(addr_str) => {
            if let Ok(validated_addr) = deps.api.addr_validate(&addr_str) {
                validated_addr
            } else {
                deps.api.addr_validate(&cw20_msg.sender)?
            }
        },
        Err(_) => deps.api.addr_validate(&cw20_msg.sender)?,
    };

    // Get or register the CW20 token
    let token_addr = info.sender.clone();
    let subdenom = token_addr_to_subdenom(&TokenType::CW20, &token_addr.to_string());
    let denom = format!("factory/{}/{}", env.contract.address, subdenom);
    
    // Check if we've seen this token before
    let mut response = Response::new();
    if !CW20_TO_DENOM.has(deps.storage, &token_addr) {
        // Verify this is a valid CW20 token
        let _token_info = deps.querier.query_wasm_smart::<cw20::TokenInfoResponse>(
            token_addr.clone(), 
            &cw20::Cw20QueryMsg::TokenInfo {}
        )?;
        
        // Register the token
        CW20_TO_DENOM.save(deps.storage, &token_addr, &denom)?;
        
        // Save token info
        TOKEN_INFO.save(deps.storage, &denom, &TokenRegistry {
            token_type: TokenType::CW20,
            token_address: token_addr.to_string(),
            wrapped_denom: denom.clone(),
        })?;
        
        // Create the denom
        response = response.add_message(SeiMsg::CreateDenom { subdenom });
    }

    // Create the wrapped token
    let amount = Coin {
        denom: denom.clone(),
        amount: cw20_msg.amount,
    };

    // Mint and send tokens
    response = response
        .add_message(SeiMsg::MintTokens { amount: amount.clone() })
        .add_submessage(SubMsg::new(CosmosMsg::Bank(BankMsg::Send {
            amount: vec![amount],
            to_address: recipient_addr.to_string(),
        })))
        .add_attribute("action", "wrap_cw20")
        .add_attribute("token", token_addr.to_string())
        .add_attribute("amount", cw20_msg.amount.to_string())
        .add_attribute("recipient", recipient_addr.to_string());

    Ok(response)
}

pub fn handle_wrap_erc20(
    deps: DepsMut<SeiQueryWrapper>,
    env: Env,
    info: MessageInfo,
    evm_sender: Binary,
    token_addr: String,
    amount: Uint128,
    recipient: Option<Addr>,
) -> Result<Response<SeiMsg>, TokenWrapperError> {
    // Ensure no native tokens were sent
    nonpayable(&info).map_err(TokenWrapperError::PaymentError)?;

    // Validate EVM address format
    if !token_addr.starts_with("0x") {
        return Err(TokenWrapperError::InvalidEvmAddress(token_addr));
    }

    // Query token info to validate it's a real ERC20
    let querier = SeiQuerier::new(&deps.querier);
    querier
        .erc20_token_info(token_addr.clone(), env.contract.address.to_string())
        .map_err(|err| TokenWrapperError::InvalidERC20Contract(err))?;

    // Generate standardized token address and denom
    let capped_tkn_addr = token_addr[2..].to_uppercase();
    // Fix: Add underscore prefix to unused variable
    let _bare_addr: [u8; 20] = hex::FromHex::from_hex(&capped_tkn_addr)
        .map_err(|_| TokenWrapperError::InvalidEvmAddress(token_addr.clone()))?;

    let subdenom = token_addr_to_subdenom(&TokenType::ERC20, &token_addr);
    let denom = format!("factory/{}/{}", env.contract.address, subdenom);

    // Check if we've seen this token before
    let mut response = Response::new();
    if !ERC20_TO_DENOM.has(deps.storage, &token_addr) {
        // Register the token
        ERC20_TO_DENOM.save(deps.storage, &token_addr, &denom)?;
        
        // Save token info
        TOKEN_INFO.save(deps.storage, &denom, &TokenRegistry {
            token_type: TokenType::ERC20,
            token_address: token_addr.clone(),
            wrapped_denom: denom.clone(),
        })?;
        
        // Create the denom
        response = response.add_message(SeiMsg::CreateDenom { subdenom });
    }

    // Create EVM payload for transferFrom
    let recipient_addr = recipient.unwrap_or(info.sender);
    let contract_addr: [u8; 20] = match env.contract.address.as_bytes().try_into() {
        Ok(addr) => addr,
        Err(_) => return Err(TokenWrapperError::InvalidRecipient),
    };
    
    let payload = encode_transfer_from_payload(evm_sender, contract_addr, amount)?;
    
    // Create the coin to mint
    let amount_coin = Coin {
        denom: denom.clone(),
        amount,
    };

    // Construct the full response
    response = response
        .add_submessage(SubMsg {
            id: WRAP_EVM_CALL_ID,
            msg: SeiMsg::CallEvm {
                to: token_addr.clone(),
                data: payload,
                value: Uint128::zero(),
            }
            .into(),
            gas_limit: None,
            reply_on: ReplyOn::Always,
        })
        .add_message(SeiMsg::MintTokens { amount: amount_coin.clone() })
        .add_submessage(SubMsg::new(CosmosMsg::Bank(BankMsg::Send {
            amount: vec![amount_coin],
            to_address: recipient_addr.to_string(),
        })))
        .add_attribute("action", "wrap_erc20")
        .add_attribute("token", token_addr)
        .add_attribute("amount", amount.to_string())
        .add_attribute("recipient", recipient_addr.to_string());

    Ok(response)
}

pub fn handle_unwrap(
    deps: DepsMut<SeiQueryWrapper>,
    env: Env,
    info: MessageInfo,
    token_type: TokenType,
    evm_recipient: Option<Binary>,
    cosmos_recipient: Option<Addr>,
) -> Result<Response<SeiMsg>, TokenWrapperError> {
    // Ensure tokens were sent
    if info.funds.is_empty() {
        return Err(TokenWrapperError::UnfundedCall);
    }

    let mut response = Response::new();
    
    // Process each sent token
    for fund in info.funds {
        // Split denom to validate it belongs to this contract
        let parts: Vec<&str> = fund.denom.split('/').collect();
        if parts.len() != 3 || parts[0] != "factory" || parts[1] != env.contract.address.as_str() {
            return Err(TokenWrapperError::TokenDoesntBelongToContract);
        }
        
        // Look up token info
        let token_info = TOKEN_INFO.load(deps.storage, &fund.denom)
            .map_err(|_| TokenWrapperError::TokenDoesntBelongToContract)?;
            
        // Verify token type matches
        if token_info.token_type != token_type {
            return Err(TokenWrapperError::InvalidTokenType);
        }
        
        // Handle unwrapping based on token type
        match token_type {
            TokenType::ERC20 => {
                // For ERC20, we need an EVM recipient
                let evm_addr = match evm_recipient.clone() {
                    Some(addr) => {
                        if addr.len() != 20 {
                            return Err(TokenWrapperError::InvalidRecipient);
                        }
                        addr
                    },
                    None => return Err(TokenWrapperError::MissingRecipient),
                };
                
                // Encode transfer call
                let evm_recipient_array: [u8; 20] = evm_addr.as_slice().try_into()?;
                let evm_payload = encode_transfer_payload(evm_recipient_array, fund.amount);
                
                // Add unwrap operation
                response = response
                    .add_submessage(SubMsg {
                        id: UNWRAP_EVM_CALL_ID,
                        msg: SeiMsg::CallEvm {
                            to: token_info.token_address,
                            data: evm_payload,
                            value: Uint128::zero(),
                        }
                        .into(),
                        gas_limit: None,
                        reply_on: ReplyOn::Always,
                    })
                    .add_message(SeiMsg::BurnTokens { amount: fund.clone() });
            },
            TokenType::CW20 => {
                // For CW20, we need a Cosmos recipient
                let recipient = match cosmos_recipient.clone() {
                    Some(addr) => addr,
                    None => return Err(TokenWrapperError::MissingRecipient),
                };
                
                // Add unwrap operation
                response = response
                    .add_submessage(SubMsg::new(WasmMsg::Execute {
                        contract_addr: token_info.token_address,
                        msg: to_json_binary(&cw20::Cw20ExecuteMsg::Transfer {
                            amount: fund.amount,
                            recipient: recipient.to_string(),
                        })?,
                        funds: vec![],
                    }))
                    .add_message(SeiMsg::BurnTokens { amount: fund.clone() });
            },
        }
    }
    
    response = response.add_attribute("action", "unwrap");
    Ok(response)
}

// Helper function to encode ERC20 transferFrom call
fn encode_transfer_from_payload(
    owner: Binary,
    recipient: [u8; 20],
    amount: Uint128
) -> Result<String, TokenWrapperError> {
    if owner.len() != 20 {
        return Err(TokenWrapperError::InvalidEvmAddress(format!("0x{}", hex::encode(owner))));
    }

    let mut buff = Vec::with_capacity(100);
    buff.extend_from_slice(TRANSFER_FROM_SIG);
    buff.extend_from_slice(&[0; 12]);
    buff.extend_from_slice(owner.as_slice());
    buff.extend_from_slice(&[0; 12]);
    buff.extend_from_slice(&recipient);
    buff.extend_from_slice(&[0; 16]);
    buff.extend_from_slice(&amount.to_be_bytes());

    Ok(Binary::from(buff).to_base64())
}

// Helper function to encode ERC20 transfer call
fn encode_transfer_payload(recipient: [u8; 20], amount: Uint128) -> String {
    let mut buff = Vec::with_capacity(68);

    buff.extend_from_slice(TRANSFER_SIG);
    buff.extend_from_slice(&[0; 12]);
    buff.extend_from_slice(&recipient);
    buff.extend_from_slice(&[0; 16]);
    buff.extend_from_slice(&amount.to_be_bytes());

    Binary::from(buff).to_base64()
}