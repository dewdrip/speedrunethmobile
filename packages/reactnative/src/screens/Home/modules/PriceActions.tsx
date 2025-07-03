import { formatEther, parseEther } from 'ethers';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import {
  useScaffoldContractRead,
  useScaffoldContractWrite
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE } from '../../../utils/styles';

const tokenName = 'CORN';

const PriceActions = () => {
  const { data: price } = useScaffoldContractRead({
    contractName: 'CornDEX',
    functionName: 'currentPrice'
  });

  const { write: writeContractAsync } = useScaffoldContractWrite({
    contractName: 'MovePrice',
    functionName: 'movePrice'
  });

  const priceOfOneCORN = price
    ? parseEther((1 / Number(formatEther(price))).toString())
    : undefined;
  const renderPrice =
    priceOfOneCORN === undefined ? (
      <View style={styles.skeleton} />
    ) : (
      Number(formatEther(priceOfOneCORN)).toFixed(6)
    );
  const renderETHPrice = price ? (
    Number(formatEther(price)).toFixed(2)
  ) : (
    <View style={styles.skeleton} />
  );

  const handleClick = async (isIncrease: boolean) => {
    if (price === undefined) {
      console.error('Price is undefined');
      return;
    }
    const amount = parseEther('50000');
    const amountToSell = isIncrease ? amount : -amount * 1000n;

    try {
      await writeContractAsync({
        args: [amountToSell]
      });
    } catch (e) {
      console.error('Error setting the price:', e);
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{tokenName} Price</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{renderPrice} ETH</Text>
          <Text style={styles.priceText}>{renderETHPrice} CORN/ETH</Text>
        </View>
        <View style={styles.buttonContainer}>
          <IconButton
            icon={() => (
              <Ionicons name="remove" size={FONT_SIZE.xl} color="white" />
            )}
            mode="contained"
            containerColor={COLORS.primary}
            size={24}
            onPress={() => handleClick(false)}
            style={styles.button}
          />
          <IconButton
            icon={() => (
              <Ionicons name="add" size={FONT_SIZE.xl} color="white" />
            )}
            mode="contained"
            containerColor={COLORS.primary}
            size={24}
            onPress={() => handleClick(true)}
            style={styles.button}
          />
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
    alignItems: 'center',
    gap: 8
  },
  header: {
    alignItems: 'center'
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    ...globalStyles.text
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 8
  },
  priceText: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.text
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    margin: 0
  },
  skeleton: {
    width: 40,
    height: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    marginRight: 4
  }
});

export default PriceActions;
