import { formatEther } from 'ethers';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useScaffoldReadContract } from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import {
  calculatePositionRatio,
  getRatioColorClass
} from '../../../utils/helpers';
import { FONT_SIZE } from '../../../utils/styles';

type UserPositionProps = {
  user: string;
  ethPrice: number;
  inputAmount: number;
};

const RatioChange = ({ user, ethPrice, inputAmount }: UserPositionProps) => {
  const { data: userCollateral } = useScaffoldReadContract({
    contractName: 'Lending',
    functionName: 's_userCollateral',
    args: [user]
  });

  const { data: userBorrowed } = useScaffoldReadContract({
    contractName: 'Lending',
    functionName: 's_userBorrowed',
    args: [user]
  });

  const borrowedAmount = Number(formatEther(userBorrowed || 0n));
  const ratio =
    borrowedAmount === 0
      ? 'N/A'
      : calculatePositionRatio(
          Number(formatEther(userCollateral || 0n)),
          borrowedAmount,
          ethPrice
        );

  const getNewRatio = (borrowedAmount: number, inputAmount: number) => {
    const newBorrowAmount = borrowedAmount + inputAmount;
    if (newBorrowAmount < 0) {
      return (
        <Text style={[styles.ratioText, { color: getRatioColorClass(1) }]}>
          N/A
        </Text>
      );
    } else if (newBorrowAmount === 0) {
      return (
        <Text style={[styles.ratioText, { color: getRatioColorClass(1000) }]}>
          ∞
        </Text>
      );
    }
    const newRatio = calculatePositionRatio(
      Number(formatEther(userCollateral || 0n)),
      newBorrowAmount,
      ethPrice
    );
    return (
      <Text style={[styles.ratioText, { color: getRatioColorClass(newRatio) }]}>
        {newRatio.toFixed(2)}%
      </Text>
    );
  };

  if (inputAmount === 0 || isNaN(inputAmount)) {
    return null;
  }

  return (
    <View style={styles.container}>
      {ratio === 'N/A' ? (
        <Text style={[styles.ratioText, { color: getRatioColorClass(1000) }]}>
          ∞
        </Text>
      ) : (
        <Text style={[styles.ratioText, { color: getRatioColorClass(ratio) }]}>
          {ratio.toFixed(2)}%
        </Text>
      )}
      <Text style={styles.arrow}> → </Text>
      {getNewRatio(borrowedAmount, inputAmount)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: FONT_SIZE.sm
  },
  ratioText: {
    fontSize: FONT_SIZE.sm,
    ...globalStyles.text
  },
  arrow: {
    fontSize: FONT_SIZE.sm,
    ...globalStyles.text,
    marginHorizontal: 4
  }
});

export default RatioChange;
