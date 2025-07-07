import { Contract, InterfaceAbi, JsonRpcProvider } from 'ethers';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSharedValue } from 'react-native-reanimated';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import {
  useAccount,
  useDeployedContractInfo,
  useNetwork
} from '../hooks/eth-mobile';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../utils/styles';
import Snowman from './Snowman';

type Props = { balance: number };

export default function SnowmanList({ balance }: Props) {
  const [snowmanBalance, setSnowmanBalance] = useState(balance);
  const [snowmen, setSnowmen] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const account = useAccount();
  const network = useNetwork();

  const { data: snowmanContract, isLoading: isLoadingSnowmanContract } =
    useDeployedContractInfo({
      contractName: 'Snowman'
    });

  useEffect(() => {
    if (isLoadingSnowmanContract) return;

    (async () => {
      setIsLoading(true);
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
      setIsLoading(false);
    })();
  }, [balance, isLoadingSnowmanContract]);

  const renderSnowmanList = () => {
    if (!snowmen && isLoading) return;

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
    <View>
      <Text variant="titleLarge" style={styles.totalCount}>
        You own {snowmanBalance} Snowman☃️
      </Text>
      {renderSnowmanList()}
    </View>
  );
}

const styles = StyleSheet.create({
  totalCount: { textAlign: 'center' },
  snowmanContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  }
});
