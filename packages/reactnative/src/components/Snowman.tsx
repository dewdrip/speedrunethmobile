import { useNavigation } from '@react-navigation/native';
import base64 from 'base-64';
import { Contract, InterfaceAbi, JsonRpcProvider } from 'ethers';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { useDeployedContractInfo, useNetwork } from '../hooks/eth-mobile';
import { COLORS } from '../utils/constants';
import { WINDOW_WIDTH } from '../utils/styles';

type Props = { id: number };
export interface Metadata {
  name: string;
  image: string;
}

export default function Snowman({ id }: Props) {
  const [metadata, setMetadata] = useState<Metadata>();
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const network = useNetwork();

  const { data: snowmanContract, isLoading: isLoadingSnowmanContract } =
    useDeployedContractInfo({
      contractName: 'Snowman'
    });

  const getDetails = async () => {
    if (!snowmanContract) return;

    try {
      setIsLoading(true);
      const provider = new JsonRpcProvider(network.provider);

      const snowman = new Contract(
        snowmanContract.address,
        snowmanContract.abi as InterfaceAbi,
        provider
      );

      const tokenURI: string = await snowman.tokenURI(id);
      const metadata = JSON.parse(
        base64.decode(tokenURI.replace('data:application/json;base64,', ''))
      );
      const decodedMetadataImage = base64.decode(
        metadata.image.replace('data:image/svg+xml;base64,', '')
      );
      metadata.image = decodedMetadataImage;

      setMetadata(metadata);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDetails();
  }, [isLoadingSnowmanContract]);

  if (isLoading)
    return (
      <Card
        style={{
          width: WINDOW_WIDTH * 0.4,
          height: WINDOW_WIDTH * 0.4,
          backgroundColor: '#fafafa'
        }}
      >
        {null}
      </Card>
    );
  if (!metadata) return null;

  return (
    <Pressable
      onPress={() => navigation.navigate('Closet', { tokenId: id, metadata })}
    >
      <SvgXml
        xml={metadata.image}
        width={WINDOW_WIDTH * 0.4}
        height={WINDOW_WIDTH * 0.4}
      />
      <View style={styles.id}>
        <Text variant="bodyLarge" style={{ fontWeight: '500' }}>
          {metadata.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  id: {
    position: 'absolute',
    top: 7,
    left: 2,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    borderRadius: 4
  }
});
