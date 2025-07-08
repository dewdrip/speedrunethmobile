import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { Snowman } from '../typechain-types';

/**
 * Adds accessories to the Snowman contract after deployment
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const addAccessories: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { get } = hre.deployments;

  // Get the deployed contracts
  const hat = await get('Hat');
  const scarf = await get('Scarf');
  const belt = await get('Belt');
  const snowman = await hre.ethers.getContract<Snowman>('Snowman', deployer);

  const accessories = [hat.address, scarf.address, belt.address];
  const positions = [1, 0, 0];

  console.log('Adding accessories to Snowman contract...');
  await snowman.addAccessories(accessories, positions);
  console.log('Accessories added successfully!');
};

export default addAccessories;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AddAccessories
addAccessories.tags = ['AddAccessories'];

// This ensures that the main contracts are deployed before adding accessories
addAccessories.dependencies = ['Snowman'];
