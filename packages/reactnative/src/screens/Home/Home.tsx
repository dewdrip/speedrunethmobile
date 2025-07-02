import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Address } from '../../components/eth-mobile';
import { useDeployedContractInfo } from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import Liquidity from './modules/Liquidity';
import ProvideLiquidity from './modules/ProvideLiquidity';
import SwapForm from './modules/SwapForm';
import WithdrawLiquidity from './modules/WithdrawLiquidity';

export default function Home() {
  const { data: dexContract } = useDeployedContractInfo('DEX');

  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: 8, paddingVertical: 32, alignItems: 'center' }}>
        <Text variant="headlineMedium" style={styles.title}>
          DEX Contract
        </Text>

        <Address
          address={dexContract?.address ?? ''}
          containerStyle={styles.addressContainer}
        />

        <Liquidity />
        <SwapForm />
        <ProvideLiquidity />
        <WithdrawLiquidity />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  title: {
    ...globalStyles.textMedium
  },
  addressContainer: {
    alignSelf: 'center',
    transform: [{ scale: 1.2 }]
  }
});
