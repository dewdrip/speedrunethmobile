import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import {
  useAccount,
  useScaffoldContract,
  useScaffoldContractRead
} from '../hooks/eth-mobile';
import globalStyles from '../styles/globalStyles';
import { COLORS } from '../utils/constants';
import { NFTMetaData } from '../utils/simpleNFT/nftsMetadata';
import { FONT_SIZE } from '../utils/styles';
import { NFTCard } from './NFTCard';

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

export default function MyHoldings() {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);

  const toast = useToast();

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: 'YourCollectible'
  });

  const { data: myTotalBalance } = useScaffoldContractRead({
    contractName: 'YourCollectible',
    functionName: 'balanceOf',
    args: [connectedAddress],
    watch: true
  });

  const updateMyCollectibles = async (): Promise<void> => {
    if (yourCollectibleContract === undefined || connectedAddress === undefined)
      return;

    setAllCollectiblesLoading(true);
    const collectibleUpdate: Collectible[] = [];
    const _myTotalBalance = await yourCollectibleContract.read.balanceOf([
      connectedAddress
    ]);
    const totalBalance = parseInt(_myTotalBalance.toString());
    for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
      try {
        const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([
          connectedAddress,
          BigInt(tokenIndex)
        ]);

        const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);

        const ipfsHash = tokenURI.replace(
          'https://ipfs.io/ipfs/',
          'https://api.universalprofile.cloud/ipfs/'
        );

        const nftMetadata: NFTMetaData = (await axios.get(ipfsHash)).data;

        collectibleUpdate.push({
          id: parseInt(tokenId.toString()),
          uri: tokenURI,
          owner: connectedAddress,
          ...nftMetadata
        });
      } catch (e) {
        toast.show('Error fetching all collectibles', {
          type: 'danger'
        });
        setAllCollectiblesLoading(false);
        console.log(e);
      }
    }
    collectibleUpdate.sort((a, b) => b.id - a.id);
    setMyAllCollectibles(collectibleUpdate);
    setAllCollectiblesLoading(false);
  };

  useEffect(() => {
    updateMyCollectibles();
  }, [myTotalBalance, yourCollectibleContract, connectedAddress]);

  return (
    <>
      {allCollectiblesLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {myAllCollectibles.length === 0 ? (
        <View style={styles.noNFTsContainer}>
          <Text style={styles.noNFTsText}>No NFTs found</Text>
        </View>
      ) : (
        <View style={styles.nftContainer}>
          {myAllCollectibles.map(nft => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noNFTsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noNFTsText: {
    ...globalStyles.textSemiBold,
    fontSize: FONT_SIZE.lg
  },
  nftContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.background,
    padding: 10
  }
});
