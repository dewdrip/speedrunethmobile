import { Contract, InterfaceAbi, JsonRpcProvider } from 'ethers';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSharedValue } from 'react-native-reanimated';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import {
  useAccount,
  useDeployedContractInfo,
  useNetwork
} from '../hooks/eth-mobile';
import globalStyles from '../styles/globalStyles';
import { COLORS } from '../utils/constants';
import { FONT_SIZE, WINDOW_HEIGHT, WINDOW_WIDTH } from '../utils/styles';
import Snowman from './Snowman';

type Props = { balance: number };

export default function SnowmanList({ balance }: Props) {
  const [snowmanBalance, setSnowmanBalance] = useState(balance);
  const [snowmen, setSnowmen] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const account = useAccount();
  const network = useNetwork();

  const { data: snowmanContract, isLoading: isLoadingSnowmanContract } =
    useDeployedContractInfo({
      contractName: 'Snowman'
    });

  const getSnowmen = async () => {
    if (isLoadingSnowmanContract) return;

    try {
      setIsLoading(true);
      setHasError(false);
      setSnowmanBalance(balance);

      const provider = new JsonRpcProvider(network.provider);

      // @ts-ignore
      const snowman = new Contract(
        snowmanContract?.address as string,
        snowmanContract?.abi as InterfaceAbi,
        provider
      );
      const tokenIds = [];
      for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
        try {
          const tokenId = await snowman.tokenOfOwnerByIndex(
            account.address,
            tokenIndex
          );
          tokenIds.push({ id: tokenId });
        } catch (error) {
          console.error(error);
        }
      }

      setSnowmen(tokenIds.reverse());
    } catch (error) {
      console.error(error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getSnowmen();
  }, [balance, isLoadingSnowmanContract]);

  const renderSnowmanList = () => {
    if (hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            Failed to load your Snowmen
          </Text>
          <Button
            mode="contained"
            onPress={getSnowmen}
            style={styles.retryButton}
            labelStyle={styles.retryButtonText}
          >
            Retry
          </Button>
        </View>
      );
    }

    if (!snowmen && isLoading)
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );

    if (!snowmen || snowmen.length === 0) return;

    return (
      <Carousel
        width={WINDOW_WIDTH}
        height={WINDOW_HEIGHT * 0.7}
        data={snowmen}
        renderItem={({ item }) => (
          <Snowman key={item.id} id={Number(item.id)} />
        )}
        ref={ref}
        onProgressChange={progress}
        mode="parallax"
        loop={false}
        pagingEnabled={true}
        snapEnabled={true}
      />
    );
  };

  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  return (
    <>
      <Text variant="titleLarge" style={styles.totalCount}>
        You own {snowmanBalance} Snowman☃️
      </Text>
      {renderSnowmanList()}
    </>
  );
}

const styles = StyleSheet.create({
  totalCount: { textAlign: 'center' },
  snowmanContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    ...globalStyles.textMedium,
    fontSize: FONT_SIZE.lg,
    color: 'gray'
  },
  retryButton: {
    borderRadius: 24,
    backgroundColor: COLORS.primary
  },
  retryButtonText: {
    fontSize: FONT_SIZE.lg,
    color: 'white',
    ...globalStyles.textMedium
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  emptyText: {
    textAlign: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
