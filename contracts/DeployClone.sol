// SPDX-License-Identifier: MIT
// TRON TRC-1167 Minimal Proxy Contracts Deployment (Also known as Clones) Implementation

pragma solidity ^0.8.20;

import {Clones} from "./libs/Clones.sol";

/**@title DeployClone implements TRC-1167 standard on TRON based on OpenZeppelin Clones and Create2
 * @dev Create2.sol Changes: TVM create2 prefix (0x41) is different to EVM (0xff), thus, a slight change is needed in Create2 library (Line 98) so it properly works on TRON. More details: https://developers.tron.network/docs/migrating-eth-contracts-to-tron#opcode-level-differences
 * @dev Clones.sol Changes: predictDeterministicAddress function was modified to properly calculate the final address based on TRON's create2 prefix.
 */
contract DeployClone {
    //Event logging
    event DeployCREATEClone(address indexed instance, address indexed deployer);
    event DeployCREATE2Clone(
        address indexed instance,
        address indexed deployer,
        bytes32 indexed salt
    );

    /***  CREATE2 related functions *** /

    /**@notice Predicts the new contract deployment based on the  implementation addres and a salt
     * @param implementation Contract Address to be cloned
     * @param salt Arbitrary value to create unique contract address
     * @return Predicted Clone contract address
     */
    function getPredictCreate2Address(
        address implementation,
        bytes32 salt
    ) external view returns (address) {
        return Clones.predictDeterministicAddress(implementation, salt);
    }

    /**@notice Deploys a TRC-1167 clone proxy contract deterministically using a salt with CREATE2
     * @param implementation Contract Address to be cloned
     * @param salt Arbitrary value to create unique contract address
     * @return Clone contract address
     */
    function cloneCreate2(
        address implementation,
        bytes32 salt
    ) external returns (address) {
        address instance = Clones.cloneDeterministic(implementation, salt);
        emit DeployCREATE2Clone(instance, msg.sender, salt);
        return instance;
    }

    /**@notice Deploys a TRC-1167 clone proxy contract with initialization arguments deterministically using a salt with CREATE2
     * @param implementation Contract Address to be cloned
     * @param args Constructor immutable arguments or initialization data for the new clone contract
     * @param salt Arbitrary value to create unique contract address
     * @return Clone contract address
     */
    function cloneCreate2WithArgs(
        address implementation,
        bytes memory args,
        bytes32 salt
    ) external returns (address) {
        address instance = Clones.cloneDeterministicWithImmutableArgs(
            implementation,
            args,
            salt
        );
        emit DeployCREATE2Clone(instance, msg.sender, salt);
        return instance;
    }

    //*** Non deterministic functions (CREATE) *** /

    /**@notice Deploys a TRC-1167 clone proxy contract using CREATE
     * @param implementation Contract Address to be cloned
     * @return Clone contract address
     */
    function cloneCreate(address implementation) external returns (address) {
        address instance = Clones.clone(implementation);
        emit DeployCREATEClone(instance, msg.sender);
        return instance;
    }

    /**@notice Deploys a TRC-1167 clone proxy contract with initialization arguments  using CREATE
     * @param implementation Contract Address to be cloned
     * @param args Constructor immutable arguments or initialization data for the new clone contract
     * @return Clone contract address
     */
    function cloneCreateWithArgs(
        address implementation,
        bytes memory args
    ) external returns (address) {
        address instance = Clones.cloneWithImmutableArgs(implementation, args);
        emit DeployCREATEClone(instance, msg.sender);
        return instance;
    }

    // *** Generic Read only functions *** /
    /**@notice Gets the clone arguments when arguments were used during deployment, unpredictable if no arguments were pushed
     * @param cloneAddress Clone contract Address (known as deployed with arguments)
     * @return Clone deployment immutable Arguments
     */
    function getCloneArgs(
        address cloneAddress
    ) external view returns (bytes memory) {
        return Clones.fetchCloneArgs(cloneAddress);
    }
}
