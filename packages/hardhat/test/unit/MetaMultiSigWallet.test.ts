import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MetaMultiSigWallet } from '../../typechain-types';
import { Signer } from 'ethers';

describe('MetaMultiSigWallet', function () {
  let metaMultiSigWallet: MetaMultiSigWallet;
  let wallet: MetaMultiSigWallet;
  let signers: Signer[];
  let chainId: bigint;

  // Before each test, deploy a new contract instance
  beforeEach(async function () {
    signers = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    chainId = network.chainId;

    const MetaMultiSigWalletFactory =
      await ethers.getContractFactory('MetaMultiSigWallet');
    // Deploy with 3 owners, requiring 2 signatures
    metaMultiSigWallet = await MetaMultiSigWalletFactory.deploy(
      chainId,
      [
        await signers[0].getAddress(),
        await signers[1].getAddress(),
        await signers[2].getAddress()
      ],
      2
    );
    await metaMultiSigWallet.waitForDeployment();
    wallet = metaMultiSigWallet; // Set wallet reference
  });

  // --- DEPLOYMENT AND CONSTRUCTOR ---
  describe('Deployment', function () {
    it('Should set the correct initial owners and signaturesRequired', async function () {
      expect(await metaMultiSigWallet.isOwner(await signers[0].getAddress())).to
        .be.true;
      expect(await metaMultiSigWallet.isOwner(await signers[1].getAddress())).to
        .be.true;
      expect(await metaMultiSigWallet.isOwner(await signers[2].getAddress())).to
        .be.true;
      expect(await metaMultiSigWallet.signaturesRequired()).to.equal(2);
      expect(await metaMultiSigWallet.chainId()).to.equal(chainId);
    });

    it('Should fail if signaturesRequired is zero', async function () {
      const MetaMultiSigWalletFactory =
        await ethers.getContractFactory('MetaMultiSigWallet');
      await expect(
        MetaMultiSigWalletFactory.deploy(
          chainId,
          [await signers[0].getAddress()],
          0
        )
      ).to.be.revertedWith('constructor: must be non-zero sigs required');
    });

    it('Should fail with a zero address owner', async function () {
      const MetaMultiSigWalletFactory =
        await ethers.getContractFactory('MetaMultiSigWallet');
      await expect(
        MetaMultiSigWalletFactory.deploy(
          chainId,
          [await signers[0].getAddress(), ethers.ZeroAddress],
          1
        )
      ).to.be.revertedWith('constructor: zero address');
    });

    it('Should fail with duplicate owners', async function () {
      const MetaMultiSigWalletFactory =
        await ethers.getContractFactory('MetaMultiSigWallet');
      await expect(
        MetaMultiSigWalletFactory.deploy(
          chainId,
          [await signers[0].getAddress(), await signers[0].getAddress()],
          2
        )
      ).to.be.revertedWith('constructor: owner not unique');
    });
  });

  // --- RECEIVING ETHER ---
  describe('Receiving Ether', function () {
    it('Should accept ether and emit a Deposit event', async function () {
      const depositAmount = ethers.parseEther('1.0');
      await expect(
        signers[0].sendTransaction({
          to: await metaMultiSigWallet.getAddress(),
          value: depositAmount
        })
      )
        .to.emit(wallet, 'Deposit')
        .withArgs(await signers[0].getAddress(), depositAmount, depositAmount);

      expect(
        await ethers.provider.getBalance(await metaMultiSigWallet.getAddress())
      ).to.equal(depositAmount);
    });
  });

  // --- TRANSACTION EXECUTION ---
  describe('executeTransaction', function () {
    beforeEach(async function () {
      // Pre-fund the wallet for tests
      await signers[0].sendTransaction({
        to: await metaMultiSigWallet.getAddress(),
        value: ethers.parseEther('10.0')
      });
    });

    it('Should execute a transaction with valid signatures', async function () {
      const to = await signers[3].getAddress();
      const value = ethers.parseEther('1.0');
      const data = '0x';
      const nonce = await metaMultiSigWallet.nonce();

      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature1 = await signers[0].signMessage(ethers.getBytes(txHash));
      const signature2 = await signers[1].signMessage(ethers.getBytes(txHash));

      // Ensure signatures are ordered correctly
      const [signerA, signerB] = [
        await signers[0].getAddress(),
        await signers[1].getAddress()
      ].sort();
      const signatures =
        signerA === (await signers[0].getAddress())
          ? [signature1, signature2]
          : [signature2, signature1];

      await expect(
        wallet
          .connect(signers[0])
          .executeTransaction(to, value, data, signatures)
      )
        .to.emit(wallet, 'ExecuteTransaction')
        .withArgs(
          await signers[0].getAddress(),
          to,
          value,
          data,
          nonce,
          txHash,
          '0x'
        );

      expect(await ethers.provider.getBalance(to)).to.equal(
        ethers.parseEther('10001.0') // Initial 10000 + 1
      );
    });

    it('Should fail if a non-owner tries to execute', async function () {
      const to = await signers[4].getAddress();
      const value = 0;
      const data = '0x';
      const nonce = await metaMultiSigWallet.nonce();
      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature = await signers[0].signMessage(ethers.getBytes(txHash));

      await expect(
        wallet
          .connect(signers[4]) // Non-owner
          .executeTransaction(to, value, data, [signature, signature])
      ).to.be.revertedWith('executeTransaction: only owners can execute');
    });

    it('Should fail with not enough valid signatures', async function () {
      const to = await signers[3].getAddress();
      const value = ethers.parseEther('1.0');
      const data = '0x';
      const nonce = await metaMultiSigWallet.nonce();
      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature1 = await signers[0].signMessage(ethers.getBytes(txHash));

      await expect(
        wallet
          .connect(signers[0])
          .executeTransaction(to, value, data, [signature1])
      ).to.be.revertedWith('executeTransaction: not enough valid signatures');
    });

    it('Should fail with duplicate signatures', async function () {
      const to = await signers[3].getAddress();
      const value = ethers.parseEther('1.0');
      const data = '0x';
      const nonce = await metaMultiSigWallet.nonce();
      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature1 = await signers[0].signMessage(ethers.getBytes(txHash));

      await expect(
        wallet
          .connect(signers[0])
          .executeTransaction(to, value, data, [signature1, signature1])
      ).to.be.revertedWith(
        'executeTransaction: duplicate or unordered signatures'
      );
    });

    it('Should fail with unordered signatures', async function () {
      const to = await signers[3].getAddress();
      const value = ethers.parseEther('1.0');
      const data = '0x';
      const nonce = await metaMultiSigWallet.nonce();
      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature1 = await signers[0].signMessage(ethers.getBytes(txHash));
      const signature2 = await signers[1].signMessage(ethers.getBytes(txHash));

      // Signers 0 and 1 are already ordered by default in hardhat, so we reverse them
      const signatures = [signature2, signature1];

      await expect(
        wallet
          .connect(signers[0])
          .executeTransaction(to, value, data, signatures)
      ).to.be.revertedWith(
        'executeTransaction: duplicate or unordered signatures'
      );
    });

    it('Should fail if the underlying transaction fails', async function () {
      // Create a dummy contract that will revert
      const RevertingContract =
        await ethers.getContractFactory('RevertingContract');
      const revertingContract = await RevertingContract.deploy();
      await revertingContract.waitForDeployment();

      const to = await revertingContract.getAddress();
      const value = 0;
      // This function call will revert
      const data = revertingContract.interface.encodeFunctionData('doRevert');
      const nonce = await metaMultiSigWallet.nonce();
      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature1 = await signers[0].signMessage(ethers.getBytes(txHash));
      const signature2 = await signers[1].signMessage(ethers.getBytes(txHash));

      const [signerA, signerB] = [
        await signers[0].getAddress(),
        await signers[1].getAddress()
      ].sort();
      const signatures =
        signerA === (await signers[0].getAddress())
          ? [signature1, signature2]
          : [signature2, signature1];

      await expect(
        wallet
          .connect(signers[0])
          .executeTransaction(to, value, data, signatures)
      ).to.be.revertedWith('executeTransaction: tx failed');
    });
  });

  // --- SIGNER MANAGEMENT (via executed transactions) ---
  describe('Signer Management', function () {
    it('Should be able to add a new signer', async function () {
      const newSigner = await signers[3].getAddress();
      const newSignaturesRequired = 3;

      const data = metaMultiSigWallet.interface.encodeFunctionData(
        'addSigner',
        [newSigner, newSignaturesRequired]
      );
      const to = await metaMultiSigWallet.getAddress();
      const value = 0;
      const nonce = await metaMultiSigWallet.nonce();
      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature1 = await signers[0].signMessage(ethers.getBytes(txHash));
      const signature2 = await signers[1].signMessage(ethers.getBytes(txHash));
      const [signerA, signerB] = [
        await signers[0].getAddress(),
        await signers[1].getAddress()
      ].sort();
      const signatures =
        signerA === (await signers[0].getAddress())
          ? [signature1, signature2]
          : [signature2, signature1];

      await wallet
        .connect(signers[0])
        .executeTransaction(to, value, data, signatures);

      expect(await metaMultiSigWallet.isOwner(newSigner)).to.be.true;
      expect(await metaMultiSigWallet.signaturesRequired()).to.equal(
        newSignaturesRequired
      );
    });

    it('Should be able to remove a signer', async function () {
      const oldSigner = await signers[2].getAddress();
      const newSignaturesRequired = 1;

      const data = metaMultiSigWallet.interface.encodeFunctionData(
        'removeSigner',
        [oldSigner, newSignaturesRequired]
      );
      const to = await metaMultiSigWallet.getAddress();
      const value = 0;
      const nonce = await metaMultiSigWallet.nonce();
      const txHash = await metaMultiSigWallet.getTransactionHash(
        nonce,
        to,
        value,
        data
      );
      const signature1 = await signers[0].signMessage(ethers.getBytes(txHash));
      const signature2 = await signers[1].signMessage(ethers.getBytes(txHash));
      const [signerA, signerB] = [
        await signers[0].getAddress(),
        await signers[1].getAddress()
      ].sort();
      const signatures =
        signerA === (await signers[0].getAddress())
          ? [signature1, signature2]
          : [signature2, signature1];

      await wallet
        .connect(signers[0])
        .executeTransaction(to, value, data, signatures);

      expect(await metaMultiSigWallet.isOwner(oldSigner)).to.be.false;
      expect(await metaMultiSigWallet.signaturesRequired()).to.equal(
        newSignaturesRequired
      );
    });
  });
});

// A helper contract that has a function that always reverts
// const RevertingContractSource = `
// // SPDX-License-Identifier: MIT
// pragma solidity >=0.8.0 <0.9.0;

// contract RevertingContract {
//     function doRevert() public pure {
//         revert("This function always reverts");
//     }
// }
// `;

// // This dynamically compiles the helper contract before tests run
// ethers.provider.send('hardhat_addCompilationResult', [
//   'RevertingContract.sol',
//   {
//     source: { content: RevertingContractSource },
//     version: '0.8.9',
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200
//       }
//     }
//   }
// ]);
