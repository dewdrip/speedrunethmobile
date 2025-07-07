import { formatEther, parseEther } from 'ethers';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { IntegerInput } from '../../../components/eth-mobile';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldReadContract,
  useScaffoldWriteContract
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE } from '../../../utils/styles';
import RatioChange from './RatioChange';

const tokenName = 'CORN';

const BorrowOperations = () => {
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);

  const { address } = useAccount();

  const { data: ethPrice } = useScaffoldReadContract({
    contractName: 'CornDEX',
    functionName: 'currentPrice'
  });

  const { data: basicLendingContract } = useDeployedContractInfo({
    contractName: 'Lending'
  });

  const { writeContractAsync: writeLendingContractAsync } =
    useScaffoldWriteContract({
      contractName: 'Lending'
    });

  const { writeContractAsync: writeCornContractAsync } =
    useScaffoldWriteContract({
      contractName: 'Corn'
    });

  const { data: allowance } = useScaffoldReadContract({
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
      setIsBorrowing(true);
      await writeLendingContractAsync({
        functionName: 'borrowCorn',
        args: [borrowAmount ? parseEther(borrowAmount) : 0n]
      });
      setBorrowAmount('');
    } catch (error) {
      console.error('Error borrowing corn:', error);
    } finally {
      setIsBorrowing(false);
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
      setIsRepaying(true);
      const repayAmountWei = repayAmount ? parseEther(repayAmount) : 0n;
      if (allowance < repayAmountWei) {
        console.log('Approving corn contract');
        await writeCornContractAsync({
          functionName: 'approve',
          args: [basicLendingContract?.address, repayAmountWei]
        });
      }
      console.log('Repaying corn');
      await writeLendingContractAsync({
        functionName: 'repayCorn',
        args: [repayAmountWei]
      });
      setRepayAmount('');
    } catch (error) {
      console.error('Error repaying corn:', error);
    } finally {
      setIsRepaying(false);
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
              disabled={!borrowAmount || isBorrowing}
              loading={isBorrowing}
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
              disabled={!repayAmount || isRepaying}
              loading={isRepaying}
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
