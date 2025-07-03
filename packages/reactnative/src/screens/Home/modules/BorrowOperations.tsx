import { formatEther, parseEther } from 'ethers';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { IntegerInput } from '../../../components/eth-mobile';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldContractRead,
  useScaffoldContractWrite
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE } from '../../../utils/styles';
import RatioChange from './RatioChange';

const tokenName = 'CORN';

const BorrowOperations = () => {
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  const { address } = useAccount();

  const { data: ethPrice } = useScaffoldContractRead({
    contractName: 'CornDEX',
    functionName: 'currentPrice'
  });

  const { data: basicLendingContract } = useDeployedContractInfo('Lending');

  const { write: writeLendingContract } = useScaffoldContractWrite({
    contractName: 'Lending',
    functionName: 'borrowCorn'
  });

  const { write: writeRepayContract } = useScaffoldContractWrite({
    contractName: 'Lending',
    functionName: 'repayCorn'
  });

  const { write: writeCornContract } = useScaffoldContractWrite({
    contractName: 'Corn',
    functionName: 'approve'
  });

  const { data: allowance } = useScaffoldContractRead({
    contractName: 'Corn',
    functionName: 'allowance',
    args: [address, basicLendingContract?.address]
  });

  const handleBorrowAmountChange = (value: string | bigint) => {
    setBorrowAmount(typeof value === 'string' ? value : value.toString());
  };

  const handleRepayAmountChange = (value: string | bigint) => {
    setRepayAmount(typeof value === 'string' ? value : value.toString());
  };

  const handleBorrow = async () => {
    try {
      await writeLendingContract({
        args: [borrowAmount ? parseEther(borrowAmount) : 0n]
      });
      setBorrowAmount('');
    } catch (error) {
      console.error('Error borrowing corn:', error);
    }
  };

  const handleRepay = async () => {
    if (
      allowance === undefined ||
      repayAmount === undefined ||
      basicLendingContract === undefined
    )
      return;
    try {
      const repayAmountWei = repayAmount ? parseEther(repayAmount) : 0n;
      if (allowance < repayAmountWei) {
        console.log('Approving corn contract');
        await writeCornContract({
          args: [basicLendingContract?.address, repayAmountWei]
        });
      }
      console.log('Repaying corn');
      await writeRepayContract({
        args: [repayAmountWei]
      });
      setRepayAmount('');
    } catch (error) {
      console.error('Error repaying corn:', error);
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          Borrow Operations
        </Text>

        <View style={styles.formControl}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Borrow {tokenName}</Text>
            {address && (
              <RatioChange
                user={address}
                ethPrice={Number(formatEther(ethPrice || 0n))}
                inputAmount={Number(borrowAmount)}
              />
            )}
          </View>
          <View style={styles.inputContainer}>
            <IntegerInput
              value={borrowAmount}
              onChange={handleBorrowAmountChange}
              placeholder="Amount"
              disableMultiplyBy1e18
            />
            <Button
              mode="contained"
              onPress={handleBorrow}
              disabled={!borrowAmount}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Borrow
            </Button>
          </View>
        </View>

        <View style={styles.formControl}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Repay Debt</Text>
            {address && (
              <RatioChange
                user={address}
                ethPrice={Number(formatEther(ethPrice || 0n))}
                inputAmount={-Number(repayAmount)}
              />
            )}
          </View>
          <View style={styles.inputContainer}>
            <IntegerInput
              value={repayAmount}
              onChange={handleRepayAmountChange}
              placeholder="Amount"
              disableMultiplyBy1e18
            />
            <Button
              mode="contained"
              onPress={handleRepay}
              disabled={!repayAmount}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Repay
            </Button>
          </View>
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
    gap: 8
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.textMedium
  },
  inputContainer: {
    alignItems: 'flex-end',
    gap: 4
  },
  button: {
    borderRadius: 20,
    backgroundColor: COLORS.primary
  },
  buttonLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'white'
  }
});

export default BorrowOperations;
