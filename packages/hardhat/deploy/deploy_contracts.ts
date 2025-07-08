import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { Snowman } from '../typechain-types';

/**
 * Deploys a contract named "Snowman" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySnowman: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy libraries
  const TokenURIGen = await deploy('TokenURIGen', {
    from: deployer
  });

  const hatMetadata = await deploy('HatMetadata', {
    from: deployer,
    libraries: {
      TokenURIGen: TokenURIGen.address
    }
  });

  const scarfMetadata = await deploy('ScarfMetadata', {
    from: deployer,
    libraries: {
      TokenURIGen: TokenURIGen.address
    }
  });

  const beltMetadata = await deploy('BeltMetadata', {
    from: deployer,
    libraries: {
      TokenURIGen: TokenURIGen.address
    }
  });

  const snowmanMetadata = await deploy('SnowmanMetadata', {
    from: deployer,
    libraries: {
      TokenURIGen: TokenURIGen.address
    }
  });

  const accessoryManager = await deploy('AccessoryManager', {
    from: deployer,
    libraries: {
      TokenURIGen: TokenURIGen.address
    }
  });
  const attributesGen = await deploy('AttributesGen', {
    from: deployer
  });

  const hat = await deploy('Hat', {
    from: deployer,
    args: [deployer],
    log: true,
    libraries: {
      HatMetadata: hatMetadata.address
    },
    autoMine: true
  });

  const scarf = await deploy('Scarf', {
    from: deployer,
    args: [deployer],
    log: true,
    libraries: {
      ScarfMetadata: scarfMetadata.address
    },
    autoMine: true
  });

  const belt = await deploy('Belt', {
    from: deployer,
    args: [deployer],
    log: true,
    libraries: {
      BeltMetadata: beltMetadata.address
    },
    autoMine: true
  });

  await deploy('Snowman', {
    from: deployer,
    args: [deployer],
    log: true,
    libraries: {
      AttributesGen: attributesGen.address,
      SnowmanMetadata: snowmanMetadata.address,
      AccessoryManager: accessoryManager.address
    },
    autoMine: true
  });
};

export default deploySnowman;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Snowman
deploySnowman.tags = ['Snowman'];
