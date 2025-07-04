import { formatEther } from 'ethers';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import { Address } from '../../../components/eth-mobile';
import {
  useDeployedContractInfo,
  useScaffoldReadContract,
  useScaffoldWriteContract
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { calculatePositionRatio } from '../../../utils/helpers';
import { FONT_SIZE } from '../../../utils/styles';

const tokenName = 'CORN';
const collateralRatio = 120;

// Helper function to get ratio color
const getRatioColor = (ratio: number): string => {
  if (ratio >= 150) return COLORS.success;
  if (ratio >= 120) return COLORS.warning;
  return COLORS.error;
};

type UserPositionProps = {
  user: string;
  ethPrice: number;
  connectedAddress: string;
};

const UserPosition = ({
  user,
  ethPrice,
  connectedAddress
}: UserPositionProps) => {
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

  const { data: basicLendingContract } = useDeployedContractInfo({
    contractName: 'Lending'
  });

  const { data: allowance } = useScaffoldReadContract({
    contractName: 'Corn',
    functionName: 'allowance',
    args: [user, basicLendingContract?.address]
  });

  const { writeContract: writeLendingContract } = useScaffoldWriteContract({
    contractName: 'Lending'
  });

  const { writeContract: writeCornContract } = useScaffoldWriteContract({
    contractName: 'Corn'
  });

  const borrowedAmount = Number(formatEther(userBorrowed || 0n));
  const ratio =
    borrowedAmount === 0
      ? 'N/A'
      : calculatePositionRatio(
          Number(formatEther(userCollateral || 0n)),
          borrowedAmount,
          ethPrice
        ).toFixed(1);

  const isPositionSafe = ratio === 'N/A' || Number(ratio) >= collateralRatio;

  const liquidatePosition = async () => {
    if (
      allowance === undefined ||
      userBorrowed === undefined ||
      basicLendingContract === undefined
    )
      return;
    try {
      if (allowance < userBorrowed) {
        await writeCornContract({
          functionName: 'approve',
          args: [basicLendingContract?.address, userBorrowed]
        });
      }
      await writeLendingContract({
        functionName: 'liquidate',
        args: [user]
      });

      const borrowedValue = Number(formatEther(userBorrowed || 0n)) / ethPrice;
      const totalCollateral = Number(formatEther(userCollateral || 0n));
      const rewardValue =
        borrowedValue * 1.1 > totalCollateral
          ? totalCollateral.toFixed(2)
          : (borrowedValue * 1.1).toFixed(2);
      const shortAddress = user.slice(0, 6) + '...' + user.slice(-4);

      console.log('Liquidation successful');
      console.log(`You liquidated ${shortAddress}'s position.`);
      console.log(
        `You repaid ${Number(formatEther(userBorrowed)).toFixed(2)} ${tokenName} and received ${rewardValue} in ETH collateral.`
      );
    } catch (e) {
      console.error('Error liquidating position:', e);
    }
  };

  const isConnectedUser = connectedAddress === user;

  return (
    <DataTable.Row
      style={[styles.row, isConnectedUser && styles.connectedUserRow]}
    >
      <DataTable.Cell style={styles.cell}>
        <Address
          address={user}
          containerStyle={styles.addressContainer}
          copyable={false}
        />
      </DataTable.Cell>

      <DataTable.Cell style={styles.cell}>
        <Text style={styles.cellText}>
          {Number(formatEther(userCollateral || 0n)).toFixed(2)} ETH
        </Text>
      </DataTable.Cell>

      <DataTable.Cell style={styles.cell}>
        <Text style={styles.cellText}>
          {Number(formatEther(userBorrowed || 0n)).toFixed(2)} {tokenName}
        </Text>
      </DataTable.Cell>

      <DataTable.Cell style={styles.cell}>
        <Text
          style={[
            styles.ratioText,
            {
              color:
                ratio === 'N/A' ? COLORS.gray : getRatioColor(Number(ratio))
            }
          ]}
        >
          {ratio === 'N/A' ? 'N/A' : `${ratio}%`}
        </Text>
      </DataTable.Cell>

      <DataTable.Cell style={styles.cell}>
        <Pressable
          onPress={liquidatePosition}
          disabled={isPositionSafe}
          style={styles.liquidateButton}
        >
          <Text style={styles.liquidateButtonText}>Liquidate</Text>
        </Pressable>
      </DataTable.Cell>
    </DataTable.Row>
  );
};

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  connectedUserRow: {
    backgroundColor: 'white'
  },
  cell: {
    justifyContent: 'center',
    paddingVertical: 8
  },
  addressContainer: {
    transform: [{ scale: 0.75 }],
    marginTop: 5,
    marginLeft: -10
  },
  cellText: {
    fontSize: FONT_SIZE.sm,
    ...globalStyles.text,
    textAlign: 'center'
  },
  ratioText: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.textSemiBold,
    textAlign: 'center'
  },
  liquidateButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80
  },
  liquidateButtonText: {
    fontSize: FONT_SIZE.sm,
    ...globalStyles.textSemiBold,
    color: COLORS.primary
  }
});

export default UserPosition;
