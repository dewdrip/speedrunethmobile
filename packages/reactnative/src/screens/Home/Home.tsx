import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import CustomButton from '../../components/buttons/CustomButton';
import MyHoldings from '../../components/MyHoldings';
import {
  useAccount,
  useScaffoldReadContract,
  useScaffoldWriteContract
} from '../../hooks/eth-mobile';
import useJSONUploader from '../../hooks/useJSONUploader';
import globalStyles from '../../styles/globalStyles';
import nftsMetadata from '../../utils/simpleNFT/nftsMetadata';

export default function Home() {
  const { address: connectedAddress } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: 'YourCollectible'
  });

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: 'YourCollectible',
    functionName: 'tokenIdCounter',
    watch: true
  });

  const toast = useToast();

  const { upload } = useJSONUploader({});

  const handleMintItem = async () => {
    // circle back to the zero item if we've reached the end of the array
    if (tokenIdCounter === undefined) return;

    const tokenIdCounterNumber = Number(tokenIdCounter);
    const currentTokenMetaData =
      nftsMetadata[tokenIdCounterNumber % nftsMetadata.length];
    toast.show('Uploading to IPFS', {
      type: 'info',
      placement: 'top'
    });
    try {
      const uploadedItem = await upload(currentTokenMetaData);

      toast.show('Metadata uploaded to IPFS', {
        type: 'success',
        placement: 'top'
      });

      await writeContractAsync({
        functionName: 'mintItem',
        args: [connectedAddress, uploadedItem?.ipfsHash]
      });

      toast.show('NFT minted', {
        type: 'success',
        placement: 'top'
      });
    } catch (error) {
      toast.show(error as string, {
        type: 'danger',
        placement: 'top'
      });
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={globalStyles.text}>
          My NFTs
        </Text>

        <CustomButton
          text="Mint NFT"
          onPress={handleMintItem}
          style={styles.mintButton}
        />
      </View>

      <MyHoldings />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    paddingTop: 32,
    alignItems: 'center'
  },
  mintButton: {
    marginTop: 16,
    width: 130
  }
});
