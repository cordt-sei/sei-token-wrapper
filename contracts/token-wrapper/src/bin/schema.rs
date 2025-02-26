use cosmwasm_schema::write_api;
use sei_token_wrapper::msg::{InstantiateMsg, TokenWrapperExecMsg, TokenWrapperQueryMsg, MigrateMsg};

fn main() {
    write_api! {
        instantiate: InstantiateMsg,
        execute: TokenWrapperExecMsg,
        query: TokenWrapperQueryMsg,
        migrate: MigrateMsg,
    }
}