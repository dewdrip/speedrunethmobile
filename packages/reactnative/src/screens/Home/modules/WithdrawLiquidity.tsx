import { Address } from 'abitype';
import { JsonRpcProvider, parseEther } from 'ethers';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import {
  useAccount,
  useBalance,
  useDeployedContractInfo,
  useERC20Balance,
  useNetwork,
  useScaffoldContractRead,
  useScaffoldContractWrite
} from '../../../hooks/eth-mobile';
import { COLORS } from '../../../utils/constants';
import { parseBalance } from '../../../utils/eth-mobile';
import { FONT_SIZE } from '../../../utils/styles';

export default function WithdrawLiquidity() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [balloonAmount, setBalloonAmount] = useState('');

  const network = useNetwork();
  const account = useAccount();
  const { data: liquidity, refatch: refetchLiquidity } =
    useScaffoldContractRead({
      contractName: 'DEX',
      functionName: 'liquidity',
      args: [account.address]
    });
  const { data: totalLiquidity, refatch: refetchTotalLiquidity } =
    useScaffoldContractRead({
      contractName: 'DEX',
      functionName: 'totalLiquidity'
    });
  const { data: dexContract } = useDeployedContractInfo('DEX');
  const { data: balloonContract } = useDeployedContractInfo('Balloons');

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

  const { write: withdraw } = useScaffoldContractWrite({
    contractName: 'DEX',
    functionName: 'withdraw'
  });

  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  const handleInputChange = (value: string) => {
    if (value.trim() === '') {
      setWithdrawAmount('');
      setEthAmount('');
      setBalloonAmount('');
      return;
    }
    const amount = Number(value);

    if (isNaN(amount)) return;

    setWithdrawAmount(value.trim());

    if (!totalLiquidity || !ethReserve || !balloonReserve) return;

    const ethAmount = (parseEther(value) * ethReserve) / totalLiquidity;
    const balloonAmount = (parseEther(value) * balloonReserve) / totalLiquidity;

    setEthAmount(parseBalance(ethAmount));
    setBalloonAmount(parseBalance(balloonAmount));
  };

  const withdrawLiquidity = async () => {
    try {
      if (withdrawAmount === '') return;

      setIsLoading(true);

      await withdraw({ args: [parseEther(withdrawAmount)] });

      toast.show('Withdrawal Successful!', { type: 'success' });

      await refetchLiquidity();
      await refetchTotalLiquidity();

      setWithdrawAmount('');
      setEthAmount('');
      setBalloonAmount('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const provider = new JsonRpcProvider(network.provider);

    (async () => {
      provider.off('block');

      await refetchLiquidity();
      await refetchTotalLiquidity();

      provider.on('block', async blockNumber => {
        await refetchLiquidity();
        await refetchTotalLiquidity();
      });
    })();

    return () => {
      provider.off('block');
    };
  }, [network]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Withdraw Liquidity</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={withdrawAmount}
          mode="outlined"
          style={styles.inputField}
          outlineColor="transparent"
          activeOutlineColor="transparent"
          placeholderTextColor="#ccc"
          cursorColor="#ccc"
          placeholder="0"
          onChangeText={handleInputChange}
        />

        <Pressable onPress={withdrawLiquidity} style={styles.button}>
          {isLoading ? (
            <ActivityIndicator
              color="white"
              style={{ paddingHorizontal: 24 }}
            />
          ) : (
            <Text style={styles.buttonLabel}>Withdraw</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.balance}>
        {liquidity && parseBalance(liquidity)} LP
      </Text>

      <View style={styles.outputContainer}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: 'grey' }}>ETH</Text>
          <Text
            style={[
              styles.outputAmount,
              { color: ethAmount ? 'black' : '#ccc' }
            ]}
          >
            {ethAmount || 0}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: 'grey' }}>BAL</Text>
          <Text
            style={[
              styles.outputAmount,
              { color: balloonAmount ? 'black' : '#ccc' }
            ]}
          >
            {balloonAmount || 0}
          </Text>
        </View>
      </View>
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
  balance: {
    textAlign: 'right',
    fontSize: FONT_SIZE['md']
  },
  outputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15
  },
  outputAmount: {
    fontSize: 30
  }
});
