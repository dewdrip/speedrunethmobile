import { Abi } from 'abitype';
import base64 from 'base-64';
import { ethers, InterfaceAbi } from 'ethers';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { useToast } from 'react-native-toast-notifications';
import CustomButton from '../../../components/buttons/CustomButton';
import {
  useAccount,
  useDeployedContractInfo,
  useReadContract,
  useWriteContract
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE, WINDOW_WIDTH } from '../../../utils/styles';

type Props = {
  name: string;
};

export default function Accessory({ name }: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [accessories, setAccessories] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const { address: connectedAccount } = useAccount();

  const { data: accessoryContract } = useDeployedContractInfo({
    contractName: name
  });

  const toast = useToast();

  const { readContract } = useReadContract();
  const { writeContractAsync } = useWriteContract({
    abi: accessoryContract?.abi as Abi,
    address: accessoryContract?.address as string,
    gasLimit: 500000n
  });

  const mint = async () => {
    if (!accessoryContract) return;

    setIsMinting(true);
    try {
      await writeContractAsync({
        functionName: 'mint',
        value: ethers.parseEther('0.01')
      });

      toast.show(`Minted One Accessory`, {
        type: 'success',
        placement: 'top'
      });

      await getAccessories();
    } catch (error) {
      console.error(error);
      toast.show(`Error Minting Accessory`, {
        type: 'danger',
        placement: 'top'
      });
    }
    setIsMinting(false);
  };

  const _getAccessories = async () => {
    if (!accessoryContract) return;

    const balance = Number(
      await readContract({
        abi: accessoryContract.abi as InterfaceAbi,
        address: accessoryContract.address,
        functionName: 'balanceOf',
        args: [connectedAccount]
      })
    );

    setBalance(balance);

    const tokenURIs = [];
    for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
      try {
        const tokenId = await readContract({
          abi: accessoryContract.abi as InterfaceAbi,
          address: accessoryContract.address,
          functionName: 'tokenOfOwnerByIndex',
          args: [connectedAccount, tokenIndex]
        });

        const tokenURI = await readContract({
          abi: accessoryContract.abi as InterfaceAbi,
          address: accessoryContract.address,
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

        tokenURIs.push({ id: tokenId, ...metadata });
      } catch (error) {
        console.error(error);
      }
    }
    setAccessories(tokenURIs);
  };

  const getAccessories = async () => {
    if (!accessoryContract) return;
    setIsLoading(true);

    try {
      await _getAccessories();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAccessories();
  }, [accessoryContract]);

  const refresh = async () => {
    await _getAccessories();
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
      <View style={styles.header}>
        <Text style={styles.balance}>Balance: {balance}</Text>
        <CustomButton
          text="Mint"
          onPress={mint}
          style={styles.button}
          loading={isMinting}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <View style={styles.accessoriesContainer}>
          {accessories?.map(accessory => (
            <View key={accessory.id} style={styles.accessory}>
              <SvgXml
                xml={accessory.image}
                width={WINDOW_WIDTH * 0.4}
                height={WINDOW_WIDTH * 0.4}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  balance: {
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textSemiBold,
    marginBottom: -5
  },
  button: {
    width: '30%',
    marginTop: 10,
    alignSelf: 'flex-end'
  },
  accessoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10
  },
  accessory: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10
  }
});
