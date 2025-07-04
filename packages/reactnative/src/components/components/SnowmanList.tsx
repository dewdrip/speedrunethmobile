import { Contract, JsonRpcProvider } from 'ethers';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  useAccount,
  useDeployedContractInfo,
  useNetwork
} from '../hooks/eth-mobile';
import Snowman from './Snowman';

type Props = { balance: number };

export default function SnowmanList({ balance }: Props) {
  const [snowmanBalance, setSnowmanBalance] = useState(balance);
  const [snowmen, setSnowmen] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const account = useAccount();
  const network = useNetwork();

  const { data: snowmanContract, isLoading: isLoadingSnowmanContract } =
    useDeployedContractInfo('Snowman');

  useEffect(() => {
    if (isLoadingSnowmanContract) return;

    (async () => {
      setIsLoading(true);
      setSnowmanBalance(balance);

      const provider = new JsonRpcProvider(network.provider);

      // @ts-ignore
      const snowman = new Contract(
        snowmanContract?.address,
        snowmanContract?.abi,
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
      setSnowmen(tokenIds);
      setIsLoading(false);
    })();
  }, [balance, isLoadingSnowmanContract]);

  const renderSnowmanList = () => {
    if (!snowmen && isLoading) return;

    if (!snowmen || snowmen.length === 0) return;

    return snowmen.map(snowman => (
      <Snowman key={snowman.id} id={Number(snowman.id)} />
    ));
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.totalCount}>
        You own {snowmanBalance} Snowman☃️
      </Text>
      <ScrollView contentContainerStyle={styles.snowmanContainer}>
        {renderSnowmanList()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10
  },
  totalCount: { textAlign: 'center' },
  snowmanContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  }
});
