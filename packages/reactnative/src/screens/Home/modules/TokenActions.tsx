import { formatEther } from 'ethers';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import {
  useAccount,
  useNetwork,
  useScaffoldContractRead
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { FONT_SIZE } from '../../../utils/styles';

const tokenName = 'CORN';

const TokenActions = () => {
  const { address } = useAccount();
  const network = useNetwork();

  const { data: cornBalance } = useScaffoldContractRead({
    contractName: 'Corn',
    functionName: 'balanceOf',
    args: [address],
    watch: true
  });

  const { data: cornPrice } = useScaffoldContractRead({
    contractName: 'CornDEX',
    functionName: 'currentPrice'
  });

  const tokenBalance = `${Math.floor(Number(formatEther(cornBalance || 0n)) * 100) / 100}`;
  const isHardhatNetwork = network.id === 31337;

  const handleTransfer = () => {
    // TODO: Implement transfer modal
    console.log('Transfer clicked');
  };

  const handleSwap = () => {
    // TODO: Implement swap modal
    console.log('Swap clicked');
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          Your {tokenName} Wallet
        </Text>

        <View style={styles.formControl}>
          <Text variant="titleMedium" style={styles.label}>
            Balance
          </Text>
          <Text variant="headlineMedium" style={styles.balance}>
            {tokenBalance} {tokenName}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleTransfer}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon={({ size, color }) => (
              <Ionicons name="paper-plane-outline" size={size} color={color} />
            )}
          >
            Transfer
          </Button>

          {isHardhatNetwork && (
            <Button
              mode="contained"
              onPress={handleSwap}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              icon={({ size, color }) => (
                <Ionicons
                  name="swap-horizontal-outline"
                  size={size}
                  color={color}
                />
              )}
            >
              Swap
            </Button>
          )}
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
  formControl: {
    marginBottom: 16
  },
  label: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.textMedium
  },
  balance: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    ...globalStyles.text
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    flex: 1,
    borderRadius: 20
  },
  buttonLabel: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.textMedium,
    color: 'white'
  }
});

export default TokenActions;
