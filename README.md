# ☃️ SVG NFT

<p align="center">
<img src="https://valentinecodes.github.io/speedrunethmobile/assets/challenge-9-svg-nft.png" alt="SVG NFT" width="300">
</p>

This is an app which lets users purchase uniquely generated SVG Images with “random” properties on-chain

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

git checkout challenge-9-svg-nft

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

4. On a second terminal, deploy the contract:

```
yarn deploy
```

5. Set the `ALCHEMY_KEY` and `localhost.provider`(port **8545**) variables in `packages/reactnative/ethmobile.config.ts`

#### To determine your local IP address:

#### Mac:

```
ipconfig getifaddr en0
```

#### Windows:

```
ipconfig
```

6. Connect your device via USB or Run an emulator

7. Run on device:

#### Android

```
yarn android
```

#### IOS

```
yarn ios
```

## Contributing to ETH Mobile

We welcome contributions to ETH Mobile!

Please see [CONTRIBUTING.MD](https://github.com/dewdrip/eth-mobile/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to ETH Mobile.
