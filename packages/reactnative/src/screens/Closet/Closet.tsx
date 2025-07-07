import { useRoute } from '@react-navigation/native';
import base64 from 'base-64';
import { InterfaceAbi } from 'ethers';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useToast } from 'react-native-toast-notifications';
import CustomButton from '../../components/buttons/CustomButton';
import Header from '../../components/Header';
import {
  useDeployedContractInfo,
  useReadContract,
  useScaffoldWriteContract
} from '../../hooks/eth-mobile';
import { COLORS } from '../../utils/constants';
import { WINDOW_WIDTH } from '../../utils/styles';
import Accessory from './modules/Accessory';

interface Metadata {
  name: string;
  image: string;
}

export default function Closet() {
  const route = useRoute();
  const { tokenId, metadata: _metadata } = route.params as {
    tokenId: number;
    metadata: Metadata;
  };

  const [metadata, setMetadata] = useState<Metadata>(_metadata);
  const [isComposing, setIsComposing] = useState(false);
  const [hasAccessory, setHasAccessory] = useState(false);

  const { data: snowmanContract } = useDeployedContractInfo({
    contractName: 'Snowman'
  });
  const { data: beltContract } = useDeployedContractInfo({
    contractName: 'Belt'
  });
  const { data: hatContract } = useDeployedContractInfo({
    contractName: 'Hat'
  });
  const { data: scarfContract } = useDeployedContractInfo({
    contractName: 'Scarf'
  });

  const { readContract } = useReadContract();
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: 'Snowman',
    gasLimit: 500000n
  });

  const toast = useToast();

  const _getSnowmanMetadata = async () => {
    if (!snowmanContract) return;

    const tokenURI: string = await readContract({
      address: snowmanContract?.address,
      abi: snowmanContract?.abi as InterfaceAbi,
      functionName: 'tokenURI',
      args: [tokenId]
    });

    const metadata = JSON.parse(
      base64.decode(tokenURI.replace('data:application/json;base64,', ''))
    );
    const decodedMetadataImage = base64.decode(
      metadata.image.replace('data:image/svg+xml;base64,', '')
    );
    metadata.image = decodedMetadataImage;

    setMetadata(metadata);
  };

  const checkAccessory = async () => {
    if (!snowmanContract || !beltContract || !hatContract || !scarfContract)
      return;

    const hasBelt = await readContract({
      address: snowmanContract.address,
      abi: snowmanContract.abi as InterfaceAbi,
      functionName: 'hasAccessory',
      args: [beltContract.address, tokenId]
    });

    const hasHat = await readContract({
      address: snowmanContract.address,
      abi: snowmanContract.abi as InterfaceAbi,
      functionName: 'hasAccessory',
      args: [hatContract.address, tokenId]
    });

    const hasScarf = await readContract({
      address: snowmanContract.address,
      abi: snowmanContract.abi as InterfaceAbi,
      functionName: 'hasAccessory',
      args: [scarfContract.address, tokenId]
    });

    setHasAccessory(hasBelt || hasHat || hasScarf);
  };

  useEffect(() => {
    checkAccessory();
  }, [snowmanContract, beltContract, hatContract, scarfContract]);

  const refresh = async () => {
    await _getSnowmanMetadata();
  };

  const strip = async () => {
    if (!snowmanContract?.address || isComposing) return;

    setIsComposing(true);

    try {
      await writeContractAsync({
        functionName: 'removeAllAccessories',
        args: [tokenId]
      });

      toast.show('Removed all accessories from Snowman', {
        type: 'success',
        placement: 'top'
      });
      refresh();
    } catch (error) {
      console.log(error);
      toast.show(JSON.stringify(error), { type: 'danger', placement: 'top' });
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <Header title={`Snowman #${tokenId}`} />

      <View style={styles.snowmanContainer}>
        <SvgXml
          xml={metadata.image}
          width={WINDOW_WIDTH * 0.6}
          height={WINDOW_WIDTH * 0.6}
        />
      </View>

      {hasAccessory && (
        <CustomButton
          text="Strip"
          onPress={strip}
          disabled={isComposing}
          loading={isComposing}
          style={styles.stripButton}
        />
      )}

      <Accessory
        name="Belt"
        snowman={{ address: snowmanContract?.address, id: tokenId }}
        onAddToSnowman={refresh}
        checkForAnyAccessory={checkAccessory}
      />
      <Accessory
        name="Hat"
        snowman={{ address: snowmanContract?.address, id: tokenId }}
        onAddToSnowman={refresh}
        checkForAnyAccessory={checkAccessory}
      />
      <Accessory
        name="Scarf"
        snowman={{ address: snowmanContract?.address, id: tokenId }}
        onAddToSnowman={refresh}
        checkForAnyAccessory={checkAccessory}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  snowmanContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    width: WINDOW_WIDTH * 0.6,
    height: WINDOW_WIDTH * 0.6
  },
  stripButton: {
    width: '95%',
    alignSelf: 'center',
    backgroundColor: COLORS.error
  }
});
