use cosmwasm_std::{
  to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Reply, Response, StdResult, entry_point,
};
use sei_cosmwasm::{SeiMsg, SeiQueryWrapper};
use crate::error::TokenWrapperError;
use crate::msg::{InstantiateMsg, MigrateMsg, TokenWrapperExecMsg, TokenWrapperQueryMsg};
use crate::state::{CONFIG, Config, UNWRAP_EVM_CALL_ID, WRAP_EVM_CALL_ID};

// Import internal modules
mod error;
pub mod msg;
mod state;
mod execute;
mod query;

const CONTRACT_NAME: &str = env!("CARGO_PKG_NAME");
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
  deps: DepsMut<SeiQueryWrapper>,
  _env: Env,
  info: MessageInfo,
  _msg: InstantiateMsg,
) -> Result<Response<SeiMsg>, TokenWrapperError> {
  cw2::set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
  
  // Set config with contract owner
  let config = Config {
      owner: Some(info.sender),
  };
  CONFIG.save(deps.storage, &config)?;
  
  Ok(Response::new().add_attribute("method", "instantiate"))
}

#[entry_point]
pub fn execute(
  deps: DepsMut<SeiQueryWrapper>,
  env: Env,
  info: MessageInfo,
  msg: TokenWrapperExecMsg,
) -> Result<Response<SeiMsg>, TokenWrapperError> {
  match msg {
      TokenWrapperExecMsg::Receive(cw20_msg) => {
          execute::handle_cw20_receive(deps, env, info, cw20_msg)
      },
      TokenWrapperExecMsg::WrapERC20 { evm_sender, token_addr, amount, recipient } => {
          execute::handle_wrap_erc20(deps, env, info, evm_sender, token_addr, amount, recipient)
      },
      TokenWrapperExecMsg::Unwrap { token_type, evm_recipient, cosmos_recipient } => {
          execute::handle_unwrap(deps, env, info, token_type, evm_recipient, cosmos_recipient)
      },
  }
}

#[entry_point]
pub fn query(
  deps: Deps<SeiQueryWrapper>,
  env: Env,
  msg: TokenWrapperQueryMsg,
) -> StdResult<Binary> {
  match msg {
      TokenWrapperQueryMsg::TokenInfo { denom } => {
          to_json_binary(&query::token_info(deps, denom)?)
      },
      TokenWrapperQueryMsg::WrappedDenom { token_type, token_address } => {
          to_json_binary(&query::wrapped_denom(deps, env, token_type, token_address)?)
      },
      TokenWrapperQueryMsg::ListWrappedTokens { start_after, limit } => {
          to_json_binary(&query::list_wrapped_tokens(deps, start_after, limit)?)
      },
  }
}

#[entry_point]
pub fn reply(
  _deps: DepsMut<SeiQueryWrapper>,  // Fix: Add underscore prefix to unused variable
  _env: Env,
  msg: Reply,
) -> Result<Response<SeiMsg>, TokenWrapperError> {
  match msg.id {
      WRAP_EVM_CALL_ID | UNWRAP_EVM_CALL_ID => {
          const TRUE_BUT_IN_32_BYTES: [u8; 32] = [
              0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8,
              0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 1u8,
          ];

          let data = msg
              .result
              .into_result()
              .map_err(|e| TokenWrapperError::FailedReply(cw_utils::ParseReplyError::SubMsgFailure(e)))?
              .data
              .ok_or(TokenWrapperError::FailedReply(cw_utils::ParseReplyError::ParseFailure("No return data".into())))?;

          if data == TRUE_BUT_IN_32_BYTES {
              Ok(Response::new())
          } else {
              Err(TokenWrapperError::UnexpectedEvmReply(data))
          }
      }
      id => Err(TokenWrapperError::InvalidReplyId(id)),
  }
}

#[entry_point]
pub fn migrate(
  deps: DepsMut<SeiQueryWrapper>,
  _env: Env,
  _msg: MigrateMsg,
) -> Result<Response<SeiMsg>, TokenWrapperError> {
  cw2::set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
  Ok(Response::new().add_attribute("method", "migrate"))
}