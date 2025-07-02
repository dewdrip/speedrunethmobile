import { Address } from 'abitype';
import { parseEther } from 'ethers';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import {
  useAccount,
  useBalance,
  useDeployedContractInfo,
  useERC20Balance,
  useScaffoldContractWrite
} from '../../../hooks/eth-mobile';
import { COLORS } from '../../../utils/constants';
import { parseBalance } from '../../../utils/eth-mobile';
import { FONT_SIZE } from '../../../utils/styles';

export default function ProvideLiquidity() {
  const account = useAccount();
  const { data: dexContract } = useDeployedContractInfo('DEX');
  const { data: balloonContract } = useDeployedContractInfo('Balloons');

  const { balance: ethBalance } = useBalance({
    address: account.address,
    watch: true
  });
  const { balance: balloonBalance } = useERC20Balance({
    token: balloonContract?.address,
    userAddress: account.address as Address,
    watch: true
  });

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
  const [ethAmount, setEthAmount] = useState('');
  const [balloonAmount, setBalloonAmount] = useState<bigint | null>();

  const { write: deposit } = useScaffoldContractWrite({
    contractName: 'DEX',
    functionName: 'deposit'
  });

  const { write: approve } = useScaffoldContractWrite({
    contractName: 'Balloons',
    functionName: 'approve'
  });

  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  const handleEthAmountChange = (value: string) => {
    if (value.trim() === '') {
      setEthAmount('');
      setBalloonAmount(null);
      return;
    }
    const ethAmount = Number(value);

    if (isNaN(ethAmount)) return;

    setEthAmount(value.trim());

    if (!ethReserve || !balloonReserve) return;

    const balloonAmount = (parseEther(value) * balloonReserve) / ethReserve;

    setBalloonAmount(balloonAmount);
  };

  const depositLiquidity = async () => {
    try {
      if (
        ethAmount === '' ||
        balloonAmount === null ||
        balloonAmount === undefined
      )
        return;

      setIsLoading(true);

      await approve({
        args: [dexContract?.address, balloonAmount + 1n]
      });

      toast.show('Token Approval Successful!', { type: 'success' });

      await deposit({ value: parseEther(ethAmount) });

      toast.show('Deposit Successful!', { type: 'success' });

      setEthAmount('');
      setBalloonAmount(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Provide Liquidity</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={ethAmount}
          mode="outlined"
          style={styles.inputField}
          outlineColor="transparent"
          activeOutlineColor="transparent"
          placeholderTextColor="#ccc"
          cursorColor="#ccc"
          placeholder="0"
          onChangeText={handleEthAmountChange}
        />

        <Pressable onPress={depositLiquidity} style={styles.button}>
          {isLoading ? (
            <ActivityIndicator
              color="white"
              style={{ paddingHorizontal: 18 }}
            />
          ) : (
            <Text style={styles.buttonLabel}>Provide</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.balance}>
        {ethBalance !== null ? parseBalance(ethBalance) : null} ETH
      </Text>

      <View style={[styles.inputContainer, { marginTop: 10 }]}>
        <Text
          style={{
            flex: 1,
            fontSize: 35,
            color: balloonAmount ? 'black' : '#ccc'
          }}
        >
          {balloonAmount ? parseBalance(balloonAmount) : 0}
        </Text>

        <Text style={styles.pairTokenLabel}>BAL</Text>
      </View>

      <Text style={styles.balance}>
        {balloonBalance !== null ? parseBalance(balloonBalance) : null} BAL
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    padding: 10,
    alignSelf: 'center',
    marginTop: 10
  },
  title: {
    fontSize: FONT_SIZE['lg'],
    fontWeight: 'bold',
    color: 'grey'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  inputField: {
    flex: 1,
    fontSize: 35,
    marginLeft: -15,
    backgroundColor: 'transparent'
  },
  token: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: 'grey',
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: FONT_SIZE['xl'],
    fontWeight: 'bold',
    color: 'grey'
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: COLORS.primary
  },
  buttonLabel: {
    fontSize: FONT_SIZE['lg'],
    fontWeight: 'bold',
    color: 'white'
  },
  approveButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight
  },
  pairTokenLabel: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: 'grey',
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: FONT_SIZE['xl'],
    fontWeight: 'bold',
    color: 'grey'
  },
  balance: {
    textAlign: 'right',
    fontSize: FONT_SIZE['md']
  }
});
