const CloneFactory = artifacts.require('./DeployClone.sol');
const ImplementationTemplate = artifacts.require('./SmartSweeperAccount.sol');
const { TronWeb } = require('tronweb');
const { stringToHex, predictDeterministicAddress } = require('../lib/clonesHelper');

const SALT = "tronCloneTest";
const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  privateKey: process.env.PRIVATE_KEY_NILE,
});

contract('#### TEST: ClonesFactory ####', (accounts) => {
  let factoryInstance;
  let templateInstance;

  before(async () => {
    factoryInstance = await CloneFactory.deployed();
    templateInstance = await ImplementationTemplate.deployed();
    console.log('Factory contract address (hex):', factoryInstance.address);
    console.log('Factory contract address (base58):', tronWeb.address.fromHex(factoryInstance.address));
    console.log('Template (Asset Sweeper) contract address (hex):', templateInstance.address);
    console.log('Template (Asset Sweeper) contract address (base58):', tronWeb.address.fromHex(templateInstance.address));
  });

  describe('Predict Address', () => {
    it('should predict the same address', async () => {
      // Convert salt string to proper bytes32 format
      const saltBytes32 = `0x${stringToHex(SALT, 32)}`;

      // Pass the raw salt string to your helper function if it expects < 32 chars
      const address = predictDeterministicAddress({
        implementation: tronWeb.address.fromHex(templateInstance.address), // Use template, not factory
        deployer: tronWeb.address.fromHex(factoryInstance.address), // Deployer is the factory
        salt: SALT, // Pass the original string, not bytes32
      });
      console.log("Calculated addres:", address);

      // Get predicted address from contract - pass bytes32 salt
      const predictedAddress = await factoryInstance.getPredictCreate2Address(
        templateInstance.address,
        saltBytes32
      );
      console.log("Calculated from contract:", tronWeb.address.fromHex(predictedAddress));
      assert.equal(address.toLowerCase(), tronWeb.address.fromHex(predictedAddress).toLowerCase());
    });
  });

  describe('TRC-1167 functionality', () => {
    it('should predict and deploy to the same address', async () => {
      // Generate a random salt (already in correct format)
      const salt = `0x${stringToHex(crypto.randomUUID().replaceAll('-', ''), 32)}`;
      console.log('Using salt:', salt);

      // Get predicted address
      const predictedAddress = await factoryInstance.getPredictCreate2Address(templateInstance.address, salt);
      console.log('Predicted address (hex):', predictedAddress);

      // Deploy clone with same salt
      const tx = await factoryInstance.cloneCreate2(templateInstance.address, salt);
      const events = await waitForTransaction(tx);
      const deployedAddress = `41${events.data[0].result[0].slice(2)}`;

      console.log('Deployed address (hex):', deployedAddress);

      // Verify addresses match
      assert.equal(
        predictedAddress.toLowerCase(),
        deployedAddress.toLowerCase(),
        'Predicted and deployed addresses should match'
      );
    });
  });
});

async function waitForTransaction(tx) {
  let attempts = 0;
  while (attempts < 20) {
    const res = await tronWeb.event.getEventsByTransactionID(tx, { only_unconfirmed: false });
    if (res.data && res.data.length > 0) {
      return res;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  throw new Error('Transaction event not found');
}