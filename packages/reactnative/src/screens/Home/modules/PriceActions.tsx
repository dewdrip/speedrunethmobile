import { formatEther, parseEther } from 'ethers';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{tokenName} Price</Text>
        </View>
        <Text style={styles.priceText}>{renderPrice} ETH</Text>
        <Text style={styles.priceText}>{renderETHPrice} CORN/ETH</Text>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  content: {
    width: 150,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8
  },
  header: {
    alignItems: 'center'
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
    ...globalStyles.text
  },
  priceText: {
    fontSize: FONT_SIZE.sm,
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
