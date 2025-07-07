import { formatEther } from 'ethers';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import { AddressInput, IntegerInput } from '../../components/eth-mobile';
import {
  useAccount,
  useBalance,
  useDeployedContractInfo,
  useScaffoldReadContract,
  useScaffoldWriteContract
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { getTokenPrice, multiplyTo1e18 } from '../../utils/eth-mobile';
import { FONT_SIZE } from '../../utils/styles';

export default function Home() {
  const [toAddress, setToAddress] = useState('');
  const [tokensToSend, setTokensToSend] = useState('');
  const [tokensToBuy, setTokensToBuy] = useState<string | bigint>('');
  const [isApproved, setIsApproved] = useState(false);
  const [tokensToSell, setTokensToSell] = useState<string>('');

  const [isBuyingTokens, setIsBuyingTokens] = useState(false);
  const [isTransferringTokens, setIsTransferringTokens] = useState(false);
  const [isApprovingTokens, setIsApprovingTokens] = useState(false);
  const [isSellingTokens, setIsSellingTokens] = useState(false);

  const toast = useToast();
  const { address } = useAccount();

  const { data: yourTokenSymbol } = useScaffoldReadContract({
    contractName: 'YourToken',
    functionName: 'symbol'
  });

  const { data: yourTokenBalance } = useScaffoldReadContract({
    contractName: 'YourToken',
    functionName: 'balanceOf',
    args: [address],
    watch: true
  });

  const { data: vendorContractData } = useDeployedContractInfo({
    contractName: 'Vendor'
  });
  const { balance: vendorEthBalance } = useBalance({
    address: vendorContractData?.address || '',
    watch: true
  });

  const { writeContractAsync: writeVendorAsync } = useScaffoldWriteContract({
    contractName: 'Vendor'
  });

  const { writeContractAsync: writeYourTokenAsync } = useScaffoldWriteContract({
    contractName: 'YourToken'
  });

  const { data: vendorTokenBalance } = useScaffoldReadContract({
    contractName: 'YourToken',
    functionName: 'balanceOf',
    args: [vendorContractData?.address],
    watch: true
  });

  const { data: tokensPerEth } = useScaffoldReadContract({
    contractName: 'Vendor',
    functionName: 'tokensPerEth'
  });

  const handleBuyTokens = async () => {
    try {
      const tokenPrice = getTokenPrice(tokensToBuy, Number(tokensPerEth) || 0);
      setIsBuyingTokens(true);
      await writeVendorAsync({
        functionName: 'buyTokens',
        value: tokenPrice
      });
      setTokensToBuy('');
      toast.show('Tokens purchased successfully!', {
        type: 'success',
        placement: 'top'
      });
    } catch (err) {
      console.error('Error calling buyTokens function', err);
      toast.show('Failed to buy tokens', { type: 'danger', placement: 'top' });
    } finally {
      setIsBuyingTokens(false);
    }
  };

  const handleTransferTokens = async () => {
    try {
      setIsTransferringTokens(true);
      await writeYourTokenAsync({
        functionName: 'transfer',
        args: [toAddress, multiplyTo1e18(tokensToSend)]
      });
      setToAddress('');
      setTokensToSend('');
      toast.show('Tokens transferred successfully!', {
        type: 'success',
        placement: 'top'
      });
    } catch (err) {
      console.error('Error calling transfer function', err);
      toast.show('Failed to transfer tokens', {
        type: 'danger',
        placement: 'top'
      });
    } finally {
      setIsTransferringTokens(false);
    }
  };

  const handleApproveTokens = async () => {
    try {
      setIsApprovingTokens(true);
      await writeYourTokenAsync({
        functionName: 'approve',
        args: [
          vendorContractData?.address,
          multiplyTo1e18(tokensToSell as string)
        ]
      });
      setIsApproved(true);
      toast.show('Tokens approved successfully!', {
        type: 'success',
        placement: 'top'
      });
    } catch (err) {
      console.error('Error calling approve function', err);
      toast.show('Failed to approve tokens', {
        type: 'danger',
        placement: 'top'
      });
    } finally {
      setIsApprovingTokens(false);
    }
  };

  const handleSellTokens = async () => {
    try {
      setIsSellingTokens(true);
      await writeVendorAsync({
        functionName: 'sellTokens',
        args: [multiplyTo1e18(tokensToSell as string)]
      });
      setIsApproved(false);
      setTokensToSell('');
      toast.show('Tokens sold successfully!', {
        type: 'success',
        placement: 'top'
      });
    } catch (err) {
      console.error('Error calling sellTokens function', err);
      toast.show('Failed to sell tokens', { type: 'danger', placement: 'top' });
    } finally {
      setIsSellingTokens(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Token Balance Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Your token balance:{' '}
            <Text style={styles.balanceText}>
              {parseFloat(formatEther(yourTokenBalance || 0n)).toFixed(4)}
              <Text style={styles.tokenSymbol}> {yourTokenSymbol}</Text>
            </Text>
          </Text>

          <Divider style={styles.divider} />

          <Text variant="bodyLarge" style={styles.vendorBalance}>
            Vendor token balance:{' '}
            <Text style={styles.balanceText}>
              {Number(formatEther(vendorTokenBalance || 0n)).toFixed(4)}
              <Text style={styles.tokenSymbol}> {yourTokenSymbol}</Text>
            </Text>
          </Text>

          <Text variant="bodyLarge" style={styles.vendorBalance}>
            Vendor ETH balance:{' '}
            <Text style={styles.balanceText}>
              {Number(formatEther(vendorEthBalance || 0n)).toFixed(4)}
              <Text style={styles.tokenSymbol}> ETH</Text>
            </Text>
          </Text>
        </Card.Content>
      </Card>

      {/* Buy Tokens Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Buy tokens
          </Text>
          <Text variant="bodyMedium" style={styles.rateText}>
            {tokensPerEth?.toString() || 0} tokens per ETH
          </Text>

          <View style={styles.inputContainer}>
            <IntegerInput
              placeholder="amount of tokens to buy"
              value={tokensToBuy.toString()}
              onChange={value => setTokensToBuy(value)}
              disableMultiplyBy1e18
            />
          </View>

          <Button
            mode="contained"
            style={styles.button}
            onPress={handleBuyTokens}
            disabled={
              isBuyingTokens || !tokensToBuy || Number(tokensToBuy) <= 0
            }
            loading={isBuyingTokens}
          >
            Buy Tokens
          </Button>
        </Card.Content>
      </Card>

      {/* Transfer Tokens Card */}
      {!!yourTokenBalance && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Transfer tokens
            </Text>

            <View style={styles.inputContainer}>
              <AddressInput
                placeholder="to address"
                value={toAddress}
                onChange={value => setToAddress(value)}
              />
              <IntegerInput
                placeholder="amount of tokens to send"
                value={tokensToSend}
                onChange={value => setTokensToSend(value as string)}
                disableMultiplyBy1e18
              />
            </View>

            <Button
              mode="contained"
              style={styles.button}
              onPress={handleTransferTokens}
              disabled={
                isTransferringTokens ||
                !toAddress ||
                !tokensToSend ||
                Number(tokensToSend) <= 0
              }
              loading={isTransferringTokens}
            >
              Send Tokens
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Sell Tokens Card */}
      {!!yourTokenBalance && (
        <Card style={[styles.card, { marginBottom: 30 }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Sell tokens
            </Text>
            <Text variant="bodyMedium" style={styles.rateText}>
              {tokensPerEth?.toString() || 0} tokens per ETH
            </Text>

            <View style={styles.inputContainer}>
              <IntegerInput
                placeholder="amount of tokens to sell"
                value={tokensToSell}
                onChange={value => setTokensToSell(value as string)}
                disabled={isApproved || isApprovingTokens}
                disableMultiplyBy1e18
              />
            </View>

            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                style={[
                  styles.button,
                  styles.halfButton,
                  isApproved && styles.disabledButton
                ]}
                onPress={handleApproveTokens}
                disabled={isApproved || tokensToSell === ''}
                loading={isApprovingTokens}
              >
                Approve Tokens
              </Button>

              <Button
                mode="contained"
                style={[
                  styles.button,
                  styles.halfButton,
                  !isApproved && styles.disabledButton
                ]}
                onPress={handleSellTokens}
                disabled={!isApproved}
                loading={isSellingTokens}
              >
                Sell Tokens
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  card: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 24,
    backgroundColor: 'white'
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textMedium
  },
  balanceText: {
    color: COLORS.primary,
    ...globalStyles.textMedium
  },
  tokenSymbol: {
    color: COLORS.primary,
    ...globalStyles.textMedium
  },
  vendorBalance: {
    textAlign: 'center',
    marginTop: 4,
    ...globalStyles.text
  },
  divider: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray
  },
  rateText: {
    textAlign: 'center',
    marginBottom: 16,
    ...globalStyles.text
  },
  inputContainer: {
    marginBottom: 16
  },
  button: {
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    marginTop: 8,
    alignSelf: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  halfButton: {
    flex: 1
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6
  }
});
