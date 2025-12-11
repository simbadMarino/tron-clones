// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DeterministicDeploymentProxy {
    event Deployed(address indexed addr, uint256 indexed salt);

    /**
     * @dev Deploys a contract using CREATE2
     * @param code The creation bytecode of the contract
     * @param salt A salt to determine the address
     * @return addr The address of the deployed contract
     */
    function deploy(
        bytes memory code,
        uint256 salt
    ) public returns (address addr) {
        assembly {
            addr := create2(0, add(code, 0x20), mload(code), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        emit Deployed(addr, salt);
    }

    /**
     * @dev Computes the address of a contract deployed via CREATE2
     * @param code The creation bytecode
     * @param salt The salt used for deployment
     * @return predicted The predicted address
     */
    function computeAddress(
        bytes memory code,
        uint256 salt
    ) public view returns (address predicted) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(code))
        );
        predicted = address(uint160(uint256(hash)));
    }

    /**
     * @dev Computes address with custom deployer
     * @param code The creation bytecode
     * @param salt The salt
     * @param deployer The deployer address
     * @return predicted The predicted address
     */
    function computeAddressWithDeployer(
        bytes memory code,
        uint256 salt,
        address deployer
    ) public pure returns (address predicted) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), deployer, salt, keccak256(code))
        );
        predicted = address(uint160(uint256(hash)));
    }
}
