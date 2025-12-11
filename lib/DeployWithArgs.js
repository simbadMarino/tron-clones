const { TronWeb } = require('tronweb');
require('dotenv').config();
// ============================================================================
// CONFIGURATION
// ============================================================================

const NILE_TESTNET_CONFIG = {
    fullHost: 'https://nile.trongrid.io'
};

// Your deployed factory contract
const FACTORY_ADDRESS = 'TW6gRb9UVVKnGdYFGqXAiY85pBa73ukFko';

// Example implementation contract to clone (replace with your actual implementation)
const IMPLEMENTATION_ADDRESS = 'TSrrJ59BtvbrAK54wbVScCeqauevQC5yp7';

// Private key for testing (NEVER use mainnet private key!)
const PRIVATE_KEY = process.env.PRIVATE_KEY_NILE;

// ============================================================================
// INITIALIZE TRONWEB
// ============================================================================

const tronWeb = new TronWeb({
    fullHost: NILE_TESTNET_CONFIG.fullHost,
    headers: NILE_TESTNET_CONFIG.headers,
    privateKey: PRIVATE_KEY
});

// ============================================================================
// FACTORY CONTRACT ABI
// ============================================================================

const FACTORY_ABI = [
    {
        "inputs": [],
        "name": "CloneArgumentsTooLong",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "Create2EmptyBytecode",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "FailedDeployment",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "needed",
                "type": "uint256"
            }
        ],
        "name": "InsufficientBalance",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "instance",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "deployer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "salt",
                "type": "bytes32"
            }
        ],
        "name": "DeployCREATE2Clone",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "instance",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "deployer",
                "type": "address"
            }
        ],
        "name": "DeployCREATEClone",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            }
        ],
        "name": "cloneCreate",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "salt",
                "type": "bytes32"
            }
        ],
        "name": "cloneCreate2",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "args",
                "type": "bytes"
            },
            {
                "internalType": "bytes32",
                "name": "salt",
                "type": "bytes32"
            }
        ],
        "name": "cloneCreate2WithArgs",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "args",
                "type": "bytes"
            }
        ],
        "name": "cloneCreateWithArgs",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "cloneAddress",
                "type": "address"
            }
        ],
        "name": "getCloneArgs",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "salt",
                "type": "bytes32"
            }
        ],
        "name": "getPredictCreate2Address",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert TRON Base58 address to hex format
 */
function toHexAddress(base58Address) {
    return tronWeb.address.toHex(base58Address);
}

/**
 * Convert hex address back to TRON Base58 format
 */
function toBase58Address(hexAddress) {
    return tronWeb.address.fromHex(hexAddress);
}

/**
 * Encode arguments for immutable clone args
 */
function encodeArgs(types, values) {
    // Convert any Base58 addresses to hex
    const processedValues = values.map((value, index) => {
        if (types[index] === 'address' && typeof value === 'string' && value.startsWith('T')) {
            return toHexAddress(value);
        }
        return value;
    });

    return tronWeb.utils.abi.encodeParams(types, processedValues);
}

/**
 * Wait for transaction confirmation
 */
async function waitForTransaction(txId) {
    console.log(`⏳ Waiting for transaction: ${txId}`);

    let attempts = 0;
    const maxAttempts = 20; // 20 seconds timeout

    while (attempts < maxAttempts) {
        try {
            const txInfo = await tronWeb.trx.getUnconfirmedTransactionInfo(txId);
            if (txInfo && txInfo.blockNumber) {
                if (txInfo.receipt && txInfo.receipt.result === 'SUCCESS') {
                    console.log('✅ Transaction confirmed!');
                    return txInfo;
                } else {
                    console.log('❌ Transaction failed:', txInfo.receipt);
                    return txInfo;
                }
            }
        } catch (error) {
            // Transaction not yet confirmed
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error('Transaction timeout');
}

/**
 * Parse events from transaction
 */
function parseEvents(txInfo) {
    if (!txInfo.log || txInfo.log.length === 0) {
        console.log('⚠️  No events found in transaction');
        return [];
    }

    const events = [];
    for (const log of txInfo.log) {
        try {
            const eventSignature = log.topics[0];

            // DeployCREATEClone event signature
            const deployEventSig = tronWeb.sha3('DeployCREATEClone(address,address)').slice(0, 10);

            if (eventSignature === deployEventSig) {
                const instance = '0x' + log.topics[1].slice(24); // Remove padding
                const deployer = '0x' + log.topics[2].slice(24); // Remove padding

                events.push({
                    event: 'DeployCREATEClone',
                    instance: toBase58Address(instance),
                    deployer: toBase58Address(deployer)
                });
            }
        } catch (error) {
            console.error('Error parsing event:', error);
        }
    }

    return events;
}

// ============================================================================
// MAIN TEST FUNCTIONS
// ============================================================================

/**
 * Test 1: Clone without arguments (empty args)
 */
async function testCloneWithoutArgs(factory_address, implementation_adress) {
    console.log('\n' + '='.repeat(70));
    console.log('TEST 1: Clone Without Arguments');
    console.log('='.repeat(70));

    try {
        const factory = await tronWeb.contract(FACTORY_ABI, factory_address);
        const implementationHex = toHexAddress(implementation_adress);
        const emptyArgs = '0x'; // No arguments

        console.log('📝 Parameters:');
        console.log('   Implementation (Base58):', implementation_adress);
        console.log('   Implementation (Hex):', implementationHex);
        console.log('   Args:', emptyArgs);

        console.log('\n🚀 Sending transaction...');
        const tx = await factory.cloneCreateWithArgs(implementationHex, emptyArgs).send({
            feeLimit: 1000_000_000, // 1000 TRX
            callValue: 0,
            shouldPollResponse: false
        });

        console.log('📤 Transaction ID:', tx);

        const txInfo = await waitForTransaction(tx);

        if (txInfo.receipt.result === 'SUCCESS') {
            console.log('\n✅ Clone deployed successfully!');
            console.log('⛽ Energy used:', txInfo.receipt.energy_usage_total || 0);
            console.log('💰 Fee (SUN):', txInfo.fee || 0);

            const events = parseEvents(txInfo);
            if (events.length > 0) {
                console.log('\n📣 Events:');
                events.forEach(event => {
                    console.log(`   ${event.event}:`);
                    console.log(`      Instance: ${event.instance}`);
                    console.log(`      Deployer: ${event.deployer}`);
                });
            }
        }

        return txInfo;

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

/**
 * Test 2: Clone with single address argument
 */
async function testCloneWithSingleAddress(ownerAddress) {
    console.log('\n' + '='.repeat(70));
    console.log('TEST 2: Clone With Single Address Argument');
    console.log('='.repeat(70));

    try {
        const factory = await tronWeb.contract(FACTORY_ABI, FACTORY_ADDRESS);
        const implementationHex = toHexAddress(IMPLEMENTATION_ADDRESS);

        // Encode single address
        const args = encodeArgs(['address'], [ownerAddress]);

        console.log('📝 Parameters:');
        console.log('   Implementation:', IMPLEMENTATION_ADDRESS);
        console.log('   Owner Address:', ownerAddress);
        console.log('   Encoded Args:', args);

        console.log('\n🚀 Sending transaction...');
        const tx = await factory.cloneCreateWithArgs(implementationHex, args).send({
            feeLimit: 1000_000_000,
            callValue: 0,
            shouldPollResponse: false
        });

        console.log('📤 Transaction ID:', tx);

        const txInfo = await waitForTransaction(tx);

        if (txInfo.receipt.result === 'SUCCESS') {
            console.log('\n✅ Clone deployed successfully!');
            console.log('⛽ Energy used:', txInfo.receipt.energy_usage_total || 0);
            console.log('💰 Fee (SUN):', txInfo.fee || 0);

            const events = parseEvents(txInfo);
            if (events.length > 0) {
                console.log('\n📣 Events:');
                events.forEach(event => {
                    console.log(`   ${event.event}:`);
                    console.log(`      Instance: ${event.instance}`);
                    console.log(`      Deployer: ${event.deployer}`);
                });
            }
        }

        return txInfo;

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

/**
 * Test 3: Clone with multiple arguments (address, address, uint256)
 */
async function testCloneWithMultipleArgs(ownerAddress, tokenAddress, amount) {
    console.log('\n' + '='.repeat(70));
    console.log('TEST 3: Clone With Multiple Arguments');
    console.log('='.repeat(70));

    try {
        const factory = await tronWeb.contract(FACTORY_ABI, FACTORY_ADDRESS);
        const implementationHex = toHexAddress(IMPLEMENTATION_ADDRESS);

        // Encode multiple arguments
        const args = encodeArgs(
            ['address', 'address', 'uint256'],
            [ownerAddress, tokenAddress, amount]
        );

        console.log('📝 Parameters:');
        console.log('   Implementation:', IMPLEMENTATION_ADDRESS);
        console.log('   Owner Address:', ownerAddress);
        console.log('   Token Address:', tokenAddress);
        console.log('   Amount:', amount);
        console.log('   Encoded Args:', args);

        console.log('\n🚀 Sending transaction...');
        const tx = await factory.cloneCreateWithArgs(implementationHex, args).send({
            feeLimit: 1000_000_000,
            callValue: 0,
            shouldPollResponse: false
        });

        console.log('📤 Transaction ID:', tx);

        const txInfo = await waitForTransaction(tx);

        if (txInfo.receipt.result === 'SUCCESS') {
            console.log('\n✅ Clone deployed successfully!');
            console.log('⛽ Energy used:', txInfo.receipt.energy_usage_total || 0);
            console.log('💰 Fee (SUN):', txInfo.fee || 0);

            const events = parseEvents(txInfo);
            if (events.length > 0) {
                console.log('\n📣 Events:');
                events.forEach(event => {
                    console.log(`   ${event.event}:`);
                    console.log(`      Instance: ${event.instance}`);
                    console.log(`      Deployer: ${event.deployer}`);
                });
            }
        }

        return txInfo;

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

/**
 * Test 4: Clone with complex arguments (bytes, string, etc.)
 */
async function testCloneWithComplexArgs() {
    console.log('\n' + '='.repeat(70));
    console.log('TEST 4: Clone With Complex Arguments');
    console.log('='.repeat(70));

    try {
        const factory = await tronWeb.contract(FACTORY_ABI, FACTORY_ADDRESS);
        const implementationHex = toHexAddress(IMPLEMENTATION_ADDRESS);

        // Example: address, uint256, bytes32, bool
        const args = encodeArgs(
            ['address', 'uint256', 'bytes32', 'bool'],
            [
                'TYourAddressHere123456789012345678901',
                1000000,
                '0x1234567890123456789012345678901234567890123456789012345678901234',
                true
            ]
        );

        console.log('📝 Parameters:');
        console.log('   Encoded Args:', args);

        console.log('\n🚀 Sending transaction...');
        const tx = await factory.cloneCreateWithArgs(implementationHex, args).send({
            feeLimit: 1000_000_000,
            callValue: 0,
            shouldPollResponse: false
        });

        console.log('📤 Transaction ID:', f);

        const txInfo = await waitForTransaction(tx);

        if (txInfo.receipt.result === 'SUCCESS') {
            console.log('\n✅ Clone deployed successfully!');
            console.log('⛽ Energy used:', txInfo.receipt.energy_usage_total || 0);
            console.log('💰 Fee (SUN):', txInfo.fee || 0);

            const events = parseEvents(txInfo);
            if (events.length > 0) {
                console.log('\n📣 Events:');
                events.forEach(event => {
                    console.log(`   ${event.event}:`);
                    console.log(`      Instance: ${event.instance}`);
                    console.log(`      Deployer: ${event.deployer}`);
                });
            }
        }

        return txInfo;

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

/**
 * Check account balance
 */
async function checkBalance() {
    const address = tronWeb.defaultAddress.base58;
    const balance = await tronWeb.trx.getBalance(address);
    console.log('\n💰 Account Balance:');
    console.log('   Address:', address);
    console.log('   Balance:', balance / 1_000_000, 'TRX');

    if (balance < 100_000_000) { // Less than 100 TRX
        console.log('⚠️  Warning: Low balance. Get testnet TRX from: https://nileex.io/join/getJoinPage');
    }
}

// ============================================================================
// RUN TESTS
// ============================================================================

async function main() {
    console.log('\n' + '█'.repeat(70));
    console.log('🧪 TRON CLONE FACTORY TEST SUITE');
    console.log('█'.repeat(70));
    console.log('Network: Nile Testnet');
    console.log('Factory:', FACTORY_ADDRESS);
    console.log('█'.repeat(70));

    try {
        // Check balance first
        await checkBalance();

        // Uncomment the test you want to run:

        // Test 1: No arguments
        // await testCloneWithoutArgs();

        // Test 2: Single address argument
        //await testCloneWithSingleAddress('TJDMQzjJSh5eC8WezVtnDXDuWXAwjV23eF');

        // Test 3: Multiple arguments
        // await testCloneWithMultipleArgs(
        //     'TYourOwnerAddressHere12345678901234',
        //     'TYourTokenAddressHere12345678901234',
        //     1000000
        // );

        // Test 4: Complex arguments
        // await testCloneWithComplexArgs();

        // Test 5: Encode arguments
        await console.log(encodeArgs(['address'], ["TJDMQzjJSh5eC8WezVtnDXDuWXAwjV23eF"]));

        console.log('\n' + '█'.repeat(70));
        console.log('✅ ALL TESTS COMPLETED');
        console.log('█'.repeat(70));

    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    }
}

// ============================================================================
// EXPORT FOR MODULE USE
// ============================================================================

module.exports = {
    testCloneWithoutArgs,
    testCloneWithSingleAddress,
    testCloneWithMultipleArgs,
    testCloneWithComplexArgs,
    encodeArgs,
    toHexAddress,
    toBase58Address
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}