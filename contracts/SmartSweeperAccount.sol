//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**@dev TRON USDT "Sweeping" Contract, TIP-1167 Ready


Goal: Reduce energy delegation and USDT transfer complexity for wallet management / payments platforms while executing "USDT Sweeping"

Background:
TRON is heavily used by custodial wallet services, eCommerce, payments and  gift cards services due to its flexibility to offer gas-less / reduced fees transactions by staking TRX for energy.
This contract template can be cloned by a TIP-1167 minimal proxy contract to reduce deployment cost even further



Contract Requirements:

1. Contract is able to accept the following argumments:
    1.1 Contract Owner
2. Withdraw any TRC20 token balance (contract owner only)
3. Contract must be deployed with 100% Contract ratio for energy consumption ratio.
4. Make it flexibile for any TRC20 token
5. TRX withdrawal option for security and flexibility reasons.
6. Contract is able to change owner if needed

Contract Requirements Notes after Testnet deployment:

1. Requirement Partially Achieved: After trials this contract needs 255k energy (as of Jan 30th 2025), still useful for non-throw-away use cases like custodial wallets in Telegram or CEX)
    1.a) Optimizations is neded to reduce cost of deployment. Tested with Solc optimizer enabled, 200 runs. 
    1.b) Deployment cost: 255K energy
    1.c) USDT withdrawal to Hot wallet cost: Approx. 65K energy per transfer
    1.d) This approach offers platforms the flexibility to balance transfer load to optimize energy pool availability, once balance is in the bussines owner SSWC 
    and owner energy is below a certain threshold owner can optionally wait to transfer that balance to its own hot-wallet/omni wallet/cold-wallet until energy pool is recovered.
2. Requirement Achieved 
3. Requirement Achieved
4. Requirement Achieved (Automatically withdraw all balance )
5. Requirement Achieved


TO-DO:
-Explore additional ways to reduce deployment cost

*/
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

// Define an interface for TRC20 tokens (similar to ERC20 in Ethereum)
interface ITRC20 {
    // Function to transfer tokens to a recipient
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    // Function to check the token balance of a given account
    function balanceOf(address account) external view returns (uint256);
}

// Smart contract for a more advanced smart wallet
contract SmartSweeperAccount is ReentrancyGuard {
    /**@dev Address of the wallet's owner (passed trough immutable args when deployed)
     *
     * */
    function owner() public view returns (address) {
        bytes memory args = Clones.fetchCloneArgs(address(this)); // Reads appended args
        require(args.length >= 20, "Invalid args length");

        address result;
        assembly {
            result := mload(add(args, 32)) // Read from offset 32
            result := shr(96, result) // Shift to get address
        }
        return result;
    }

    // Events to log different actions in the contract
    event SweepedTRX(address indexed recipient, uint256 amount);
    event SweepedToken(
        address indexed token,
        address to,
        bool success,
        bytes data,
        uint256 data_length
    );
    // Modifier to restrict certain functions to only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner(), "Only owner may call function");
        _;
    }

    // Function to withdraw all TRC20 tokens (except a small remainder) to a hot wallet
    function sweepToken(
        address _trc20Token, // Address of the TRC20 token contract
        address _hotWallet // Address where funds will be transferred
    ) external onlyOwner {
        // Only the owner can call this function
        ITRC20 trc20Token = ITRC20(_trc20Token);

        // Get the current balance of the token in this smart contract
        uint256 smartWalletBalance = trc20Token.balanceOf(address(this));

        // Safely Transfer contract balance

        safeTransfer(trc20Token, _hotWallet, smartWalletBalance);
    }

    // Function to withdraw TRX (native TRON currency) from the wallet to a specified address
    function sweepTRX(
        uint256 amount, // Amount of TRX to withdraw
        address payable _address // Recipient's address
    ) external onlyOwner nonReentrant {
        // Only the owner can call this function
        _address.transfer(amount);
        emit SweepedTRX(_address, amount);
    }

    function safeTransfer(ITRC20 token, address to, uint256 value) internal {
        address self;
        //optional: uint256 balanceBefore = token.balanceOf(to);

        assembly {
            self := address()
        }
        // Check balance
        uint256 balance = token.balanceOf(address(self));
        require(balance >= value, "Insufficient token balance");

        // Check recipient isn't zero address
        require(to != address(0), "Transfer to zero address");

        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );
        require(success, "Low-level transfer failed");

        // Optional: Verify actual balance change, most secure but higher gas consumption
        //uint256 balanceAfter = token.balanceOf(to);
        //require(balanceAfter >= balanceBefore + value, "Balance not updated");

        // Debuggin:
        emit SweepedToken(address(token), to, success, data, data.length);
    }
}
