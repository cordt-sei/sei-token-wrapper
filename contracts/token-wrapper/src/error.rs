use cosmwasm_std::{Binary, StdError};
use cw_utils::PaymentError;
use std::array::TryFromSliceError;

#[derive(thiserror::Error, Debug)]
pub enum TokenWrapperError {
    #[error("StdError: {0}")]
    Std(#[from] StdError),

    #[error("Payment error: {0}")]
    PaymentError(#[from] PaymentError),

    #[error("Failed reply: {0}")]
    FailedReply(#[from] cw_utils::ParseReplyError),

    #[error("The `{0}` EVM address is not valid")]
    InvalidEvmAddress(String),

    #[error("The tokens received were not created by this contract")]
    TokenDoesntBelongToContract,

    #[error("No tokens were sent to this contract")]
    UnfundedCall,

    #[error("Failed to verify contract was an ERC20 token: {0}")]
    InvalidERC20Contract(StdError),

    #[error("The recipient address must be 20 bytes long")]
    InvalidRecipient,

    #[error("The reply id {0} is invalid")]
    InvalidReplyId(u64),

    #[error("Unexpected reply from EVM contract: {0}")]
    UnexpectedEvmReply(Binary),

    #[error("Invalid token type for this operation")]
    InvalidTokenType,

    #[error("Missing recipient address for unwrap operation")]
    MissingRecipient,

    #[error("Token not registered in this contract")]
    TokenNotRegistered,
    
    #[error("Invalid conversion: {0}")]
    TryFromSliceError(#[from] TryFromSliceError),
}