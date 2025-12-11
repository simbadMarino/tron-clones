const DeployClone = artifacts.require('./DeployClone.sol');
const Deterministic_Deployment_Proxy = artifacts.require('./DeterministicDeploymentProxy.sol');
const SmartSweeperAccount = artifacts.require('./SmartSweeperAccount.sol');

module.exports = async function (deployer) {
  await deployer.deploy(DeployClone);
  const deployerContract = await DeployClone.deployed();

  //Optional: Deploy a Token Sweeper contract template
  //await deployer.deploy(SmartSweeperAccount);
  //const tokenSweeperContract = await SmartSweeperAccount.deployed();
};
