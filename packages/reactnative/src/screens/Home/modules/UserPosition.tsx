import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { formatEther } from 'ethers';
import { useScaffoldContractRead, useScaffoldContractWrite } from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE } from '../../../utils/styles';
import { truncateAddress } from '../../../utils/eth-mobile';

type UserPositionProps = {
  user: string;
  connectedAddress: string;
  ethPrice: number;
};

// Helper function to calculate position ratio
const calculatePositionRatio = (
  collateralAmount: number,
  borrowedAmount: number,
  ethPrice: number
): number => {
  if (borrowedAmount === 0) return 0;
  const collateralValue = collateralAmount * ethPrice;
  return (collateralValue / borrowedAmount) * 100;
};

// Helper function to get ratio color
const getRatioColor = (ratio: number): string => {
  if (ratio >= 150) return COLORS.success;
  if (ratio >= 120) return COLORS.warning;
  return COLORS.error;
};

const UserPosition = ({ user, connectedAddress, ethPrice }: UserPositionProps) => {
  const { data: userCollateral } = useScaffoldContractRead({
    contractName: 'Lending',
    functionName: 's_userCollateral',
    args: [user]
  });

  const { data: userBorrowed } = useScaffoldContractRead({
    contractName: 'Lending',
    functionName: 's_userBorrowed',
    args: [user]
  });

  const { data: isLiquidatable } = useScaffoldContractRead({
    contractName: 'Lending',
    functionName: 'isLiquidatable',
    args: [user]
  });

  const { write: liquidateContract } = useScaffoldContractWrite({
    contractName: 'Lending',
    functionName: 'liquidate'
  });

  const collateralAmount = Number(formatEther(userCollateral || 0n));
  const borrowedAmount = Number(formatEther(userBorrowed || 0n));
  const ratio = calculatePositionRatio(collateralAmount, borrowedAmount, ethPrice);

  const handleLiquidate = async () => {
    try {
      await liquidateContract({
        args: [user]
      });
    } catch (error) {
      console.error('Error liquidating position:', error);
    }
  };

  const canLiquidate = isLiquidatable && user !== connectedAddress;

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={styles.addressText}>{truncateAddress(user)}</Text>
      </View>
      
      <View style={styles.cell}>
        <Text style={styles.valueText}>{collateralAmount.toFixed(4)} ETH</Text>
      </View>
      
      <View style={styles.cell}>
        <Text style={styles.valueText}>{borrowedAmount.toFixed(2)} CORN</Text>
      </View>
      
      <View style={styles.cell}>
        <Text style={[styles.ratioText, { color: getRatioColor(ratio) }]}>
          {ratio === 0 ? 'N/A' : `${ratio.toFixed(2)}%`}
        </Text>
      </View>
      
      <View style={styles.cell}>
        {canLiquidate ? (
          <Button
            mode="contained"
            onPress={handleLiquidate}
            style={styles.liquidateButton}
            labelStyle={styles.liquidateButtonLabel}
            buttonColor={COLORS.error}
          >
            Liquidate
          </Button>
        ) : (
          <View style={styles.emptyCell} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addressText: {
    fontSize: FONT_SIZE.sm,
    ...globalStyles.text,
    textAlign: 'center'
  },
  valueText: {
    fontSize: FONT_SIZE.sm,
    ...globalStyles.text,
    textAlign: 'center'
  },
  ratioText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center'
  },
  liquidateButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  liquidateButtonLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'white'
  },
  emptyCell: {
    width: 60,
    height: 20
  }
});

export default UserPosition; 