import { parseEther } from 'ethers';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { IntegerInput } from '../../../components/eth-mobile';
import { useScaffoldContractWrite } from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE } from '../../../utils/styles';

const CollateralOperations = () => {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { write: writeLendingContract } = useScaffoldContractWrite({
    contractName: 'Lending',
    functionName: 'addCollateral'
  });

  const { write: writeWithdrawContract } = useScaffoldContractWrite({
    contractName: 'Lending',
    functionName: 'withdrawCollateral'
  });

  const handleCollateralAmountChange = (value: string | bigint) => {
    setCollateralAmount(typeof value === 'string' ? value : value.toString());
  };

  const handleWithdrawAmountChange = (value: string | bigint) => {
    setWithdrawAmount(typeof value === 'string' ? value : value.toString());
  };

  const handleAddCollateral = async () => {
    try {
      await writeLendingContract({
        value: collateralAmount ? parseEther(collateralAmount) : 0n
      });
      setCollateralAmount('');
    } catch (error) {
      console.error('Error adding collateral:', error);
    }
  };

  const handleWithdrawCollateral = async () => {
    try {
      await writeWithdrawContract({
        args: [withdrawAmount ? parseEther(withdrawAmount) : 0n]
      });
      setWithdrawAmount('');
    } catch (error) {
      console.error('Error withdrawing collateral:', error);
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          Collateral Operations
        </Text>

        <View style={styles.formControl}>
          <Text style={styles.label}>Add Collateral (ETH)</Text>
          <View style={styles.inputContainer}>
            <IntegerInput
              value={collateralAmount}
              onChange={handleCollateralAmountChange}
              placeholder="Amount"
              disableMultiplyBy1e18
            />
            <Button
              mode="contained"
              onPress={handleAddCollateral}
              disabled={!collateralAmount}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Add
            </Button>
          </View>
        </View>

        <View style={styles.formControl}>
          <Text style={styles.label}>Withdraw Collateral (ETH)</Text>
          <View style={styles.inputContainer}>
            <IntegerInput
              value={withdrawAmount}
              onChange={handleWithdrawAmountChange}
              placeholder="Amount"
              disableMultiplyBy1e18
            />
            <Button
              mode="contained"
              onPress={handleWithdrawCollateral}
              disabled={!withdrawAmount}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Withdraw
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
    fontWeight: 'bold',
    ...globalStyles.text,
    marginBottom: 8
  },
  formControl: {
    gap: 8
  },
  label: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.text
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

export default CollateralOperations;
