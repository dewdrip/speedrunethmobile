import { formatEther } from 'ethers';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAccount, useScaffoldReadContract } from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { FONT_SIZE } from '../../../utils/styles';

const tokenName = 'CORN';

const TokenActions = () => {
  const { address } = useAccount();

  const { data: cornBalance } = useScaffoldReadContract({
    contractName: 'Corn',
    functionName: 'balanceOf',
    args: [address],
    watch: true
  });

  const tokenBalance = `${Math.floor(Number(formatEther(cornBalance || 0n)) * 100) / 100}`;

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          Your {tokenName} Wallet
        </Text>

        <View>
          <Text variant="titleMedium" style={styles.label}>
            Balance
          </Text>
          <Text variant="headlineMedium" style={styles.balance}>
            {tokenBalance} {tokenName}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8
  },
  content: {
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: FONT_SIZE.xl,
    ...globalStyles.textSemiBold,
    marginBottom: 8
  },
  label: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.textMedium
  },
  balance: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    ...globalStyles.text
  }
});

export default TokenActions;
