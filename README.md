# 📲 Multisig Wallet Implemented With Eth Mobile! 🚀

![readme-6](https://raw.githubusercontent.com/scaffold-eth/se-2-challenges/challenge-multisig/extension/packages/nextjs/public/hero.png)

👩‍👩‍👧‍👧 A multisig wallet is a smart contract that acts like a wallet, allowing us to secure assets by requiring multiple accounts to "vote" on transactions. Think of it as a treasure chest that can only be opened when all key parties agree.

📜 The contract keeps track of all transactions. Each transaction can be confirmed or rejected by the signers (smart contract owners). Only transactions that receive enough confirmations can be "executed" by the signers.

✍️ **ETH Mobile** is an open-source toolkit for building mobile decentralized applications (dApps) on Ethereum and other EVM-compatible blockchains. It simplifies mobile dApp development with fast, secure and customizable pre-built components to create, deploy and interact with smart contracts.

## Requirements

Before you begin, you need to install the following tools:

- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)
- [React Native](https://reactnative.dev/docs/environment-setup?guide=native&platform=android)
- [Yeet CLI](https://npmjs.com/package/yeet-cli)

## Quickstart

To get started, follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/dewdrip/speedrunethmobile.git

cd speedrunethmobile

git checkout challenge-8-multisig-wallet

yarn install

cd packages/reactnative

npx pod-install
```

2. Connect your WIFI to your computer. if you wish to run your app in a physical device, your device must be connected to the same WIFI

3. From the root folder, run a local network in the first terminal

```
yarn chain
```

This command starts a local Ethereum network hosted on your local IP address. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.ts`.

Alternatively, you can use [Ganache](https://archive.trufflesuite.com/ganache/) to persist the blockchain state during development

4. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

5. On another terminal, run the backend:

```
yarn backend:local
```

This command runs the local backend. The backend is located in `packages/backend-local` and can be modified to suit your needs.

6. Set the `ALCHEMY_KEY` and `localhost.provider`(port **8545**) variables in `packages/reactnative/ethmobile.config.ts`

#### To determine your local IP address:

#### Mac:

```
ipconfig getifaddr en0
```

#### Windows:

```
ipconfig
```

7. Connect your device via USB or Run an emulator

8. Run on device:

#### Android

```
yarn android
```

#### IOS

```
yarn ios
```

9. Import one of the funded accounts in your local blockchain into your wallet to have funds for testing

You can interact with your smart contract using the `DebugContracts` tab. You can configure your supported networks in `packages/reactnative/ethmobile.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `YourContract.sol` in `packages/hardhat/contracts`
- Edit your frontend in `packages/reactnative/src/screens`
- Edit your deployment scripts in `packages/hardhat/deploy`

## Contributing to ETH Mobile

We welcome contributions to ETH Mobile!

Please see [CONTRIBUTING.MD](https://github.com/dewdrip/eth-mobile/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to ETH Mobile.
