import base64 from 'base-64';
import { ethers, InterfaceAbi } from 'ethers';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { useToast } from 'react-native-toast-notifications';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import {
  useAccount,
  useDeployedContractInfo,
  useReadContract,
  useScaffoldWriteContract
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE, WINDOW_WIDTH } from '../../../utils/styles';

type Props = {
  name: string;
  snowman: {
    address: string | undefined;
    id: number;
  };
  onAddToSnowman: () => void;
  checkForAnyAccessory: () => void;
};

export default function Accessory({
  name,
  snowman,
  onAddToSnowman,
  checkForAnyAccessory
}: Props) {
  const [accessories, setAccessories] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const { address: connectedAccount } = useAccount();

  const { data: accessoryContract } = useDeployedContractInfo({
    contractName: name
  });
  const { data: snowmanContract } = useDeployedContractInfo({
    contractName: 'Snowman'
  });

  const { readContract } = useReadContract();
  const { writeContractAsync: writeAccessoryContractAsync } =
    useScaffoldWriteContract({
      contractName: name,
      gasLimit: 500000n
    });

  const { writeContractAsync: writeSnowmanContractAsync } =
    useScaffoldWriteContract({
      contractName: 'Snowman',
      gasLimit: 500000n
    });

  const toast = useToast();

  const [hasAccessory, setHasAccessory] = useState(false);

  const _refreshState = () => {
    onAddToSnowman();
    checkForAnyAccessory();
    checkAccessory();
    _getAccessories();
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

    await _getAccessories();

    setIsLoading(false);
  };

  const checkAccessory = async () => {
    if (!accessoryContract || !snowman.address) return;

    const hasAccessoryResult = await readContract({
      abi: snowmanContract?.abi as InterfaceAbi,
      address: snowman.address,
      functionName: 'hasAccessory',
      args: [accessoryContract.address, snowman.id]
    });

    setHasAccessory(hasAccessoryResult);
  };

  const removeAccessoryFromSnowman = async () => {
    if (!accessoryContract || !snowman.address || isComposing) return;

    setIsComposing(true);

    try {
      await writeSnowmanContractAsync({
        functionName: 'removeAccessory',
        args: [accessoryContract.address, snowman.id]
      });

      toast.show(`Removed ${name} from Snowman`, { type: 'success' });
      _refreshState();
    } catch (error) {
      console.log(error);
      toast.show(JSON.stringify(error), { type: 'danger' });
    } finally {
      setIsComposing(false);
    }
  };

  const addToSnowman = async (tokenId: number) => {
    if (
      !accessoryContract ||
      !snowmanContract ||
      !snowman.address ||
      isComposing
    )
      return;

    setIsComposing(true);

    try {
      // First check if the accessory is already worn and remove it if necessary
      const hasAccessory = await readContract({
        abi: snowmanContract.abi as InterfaceAbi,
        address: snowman.address,
        functionName: 'hasAccessory',
        args: [accessoryContract.address, snowman.id]
      });

      if (hasAccessory) {
        await writeSnowmanContractAsync({
          functionName: 'removeAccessory',
          args: [accessoryContract.address, snowman.id]
        });
        toast.show(`Removed ${name} from Snowman`, { type: 'success' });
      }

      const encodedSnowmanId = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256'],
        [snowman.id]
      );

      await writeAccessoryContractAsync({
        functionName: 'safeTransferFrom',
        args: [connectedAccount, snowman.address, tokenId, encodedSnowmanId]
      });

      toast.show(`Added ${name} to Snowman`, { type: 'success' });

      _refreshState();
    } catch (error) {
      console.log(error);
      toast.show(JSON.stringify(error), { type: 'danger' });
    } finally {
      setIsComposing(false);
    }
  };

  useEffect(() => {
    getAccessories();
    checkAccessory();
  }, [accessoryContract, snowman.address, snowman.id]);

  const refresh = () => {
    getAccessories();
    checkAccessory();
  };

  if (accessories?.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {name} {isComposing && <ActivityIndicator size={FONT_SIZE.sm} />}
          </Text>

          <Pressable onPress={refresh}>
            <Ionicons
              name="refresh"
              size={FONT_SIZE.lg}
              color={COLORS.primary}
            />
          </Pressable>
        </View>

        {hasAccessory && (
          <Pressable
            style={styles.removeButton}
            onPress={removeAccessoryFromSnowman}
          >
            <Text style={styles.removeButtonText}>Remove {name}</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.accessoriesContainer}
          showsHorizontalScrollIndicator={false}
          horizontal
        >
          {accessories?.map(accessory => (
            <Pressable
              key={accessory.id}
              style={styles.accessory}
              onPress={() => addToSnowman(Number(accessory.id))}
            >
              <SvgXml
                xml={accessory.image}
                width={WINDOW_WIDTH * 0.4}
                height={WINDOW_WIDTH * 0.4}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -5
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  accessoriesContainer: {
    gap: 10,
    marginTop: 10
  },
  accessory: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10
  },
  title: {
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textSemiBold
  },
  removeButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  removeButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    ...globalStyles.textMedium
  }
});
