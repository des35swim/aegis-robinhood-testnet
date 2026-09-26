// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Aegis Guard Dog Test
/// @notice A fixed-supply, valueless token for Robinhood Chain Testnet demonstrations only.
/// @dev There is deliberately no owner, mint, pause, blacklist, fee, tax, or upgrade mechanism.
contract AegisGuardDogTest is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether;

    string public constant TESTNET_NOTICE =
        "VALUELESS TEST TOKEN - ROBINHOOD CHAIN TESTNET ONLY";

    error InvalidInitialRecipient();

    constructor(address initialRecipient) ERC20("Aegis Guard Dog Test", "GDOGT") {
        if (initialRecipient == address(0)) revert InvalidInitialRecipient();
        _mint(initialRecipient, INITIAL_SUPPLY);
    }
}
