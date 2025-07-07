import { Address } from 'abitype';
import { parseEther } from 'ethers';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import {
  useAccount,
  useBalance,
  useDeployedContractInfo,
  useERC20Balance,
  useScaffoldReadContract,
  useScaffoldWriteContract
} from '../../../hooks/eth-mobile';
import { COLORS } from '../../../utils/constants';
import { parseBalance } from '../../../utils/eth-mobile';
import { FONT_SIZE } from '../../../utils/styles';
import AmountInput from './AmountInput';

export default function SwapForm() {
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const account = useAccount();
  const { data: dexContract } = useDeployedContractInfo({
    contractName: 'DEX'
  });
  const { data: balloonContract } = useDeployedContractInfo({
    contractName: 'Balloons'
  });

  // token balances
  const { balance: ethBalance } = useBalance({
    address: account.address,
    watch: true
  });
  const { balance: balloonBalance } = useERC20Balance({
    token: balloonContract?.address,
    userAddress: account.address as Address,
    watch: true
  });

  // reserves
  const { balance: ethReserve } = useBalance({
    // @ts-ignore
    address: dexContract?.address,
    watch: true
  });
  const { balance: balloonReserve } = useERC20Balance({
    token: balloonContract?.address,
    userAddress: dexContract?.address as Address,
    watch: true
  });

  const { readContract: getPrice } = useScaffoldReadContract({
    contractName: 'DEX',
    functionName: 'price',
    enable: false
  });

  const { writeContractAsync: writeDexContractAsync } =
    useScaffoldWriteContract({
      contractName: 'DEX'
    });

  const { writeContractAsync: writeBalloonsContractAsync } =
    useScaffoldWriteContract({
      contractName: 'Balloons'
    });

  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  const handleInputChange = async (value: string) => {
    if (value.trim() === '') {
      setSellAmount('');
      setBuyAmount('');
      return;
    }

    const amount = Number(value);

    if (isNaN(amount)) return;

    if (isFlipped) {
      setBuyAmount(value.trim());
    } else {
      setSellAmount(value.trim());
    }

    if (!ethReserve || !balloonReserve) return;

    try {
      if (isFlipped) {
        const price = await getPrice({
          args: [parseEther(value), balloonReserve, ethReserve]
        });

        setSellAmount(parseBalance(price));
      } else {
        const price = await getPrice({
          args: [parseEther(value), ethReserve, balloonReserve]
        });

        setBuyAmount(parseBalance(price));
      }
    } catch (error) {
      console.error('Failed to get price');
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setSellAmount('');
    setBuyAmount('');
  };

  const swap = async () => {
    try {
      if (isFlipped) {
        if (buyAmount === '') return;

        setIsLoading(true);
        await writeBalloonsContractAsync({
          functionName: 'approve',
          args: [dexContract?.address, parseEther(buyAmount)]
        });

        toast.show('Token Approval Successful!', {
          type: 'success',
          placement: 'top'
        });

        await writeDexContractAsync({
          functionName: 'tokenToEth',
          args: [parseEther(buyAmount)]
        });
      } else {
        if (sellAmount === '') return;

        await writeDexContractAsync({
          functionName: 'ethToToken',
          value: parseEther(sellAmount)
        });
      }

      toast.show('Swap Successful!', { type: 'success', placement: 'top' });

      setSellAmount('');
      setBuyAmount('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card
        style={[
          styles.card,
          isFlipped
            ? { flexDirection: 'column-reverse' }
            : { flexDirection: 'column' }
        ]}
      >
        <Card.Content>
          <AmountInput
            title={isFlipped ? 'Buy' : 'Sell'}
            value={sellAmount}
            token="ETH"
            balance={ethBalance !== null ? parseBalance(ethBalance) : null}
            onChange={handleInputChange}
            isDisabled={isFlipped}
          />

          <IconButton
            icon="arrow-down"
            size={24}
            iconColor="white"
            onPress={handleFlip}
            style={styles.switchButton}
          />

          <AmountInput
            title={isFlipped ? 'Sell' : 'Buy'}
            value={buyAmount}
            token="BAL"
            balance={
              balloonBalance !== null ? parseBalance(balloonBalance) : null
            }
            onChange={handleInputChange}
            isDisabled={!isFlipped}
          />
        </Card.Content>
      </Card>
      <Button
        mode="contained"
        onPress={swap}
        style={styles.button}
        labelStyle={styles.buttonLabel}
        loading={isLoading}
      >
        Swap
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    borderRadius: 12,
    backgroundColor: 'white'
  },
  card: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: 'white'
  },
  switchButton: {
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
    zIndex: 10
  },
  button: {
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 5,
    backgroundColor: COLORS.primary
  },
  buttonLabel: {
    fontSize: FONT_SIZE['lg'],
    color: 'white'
  }
});
