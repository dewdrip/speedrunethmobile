import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ethers, InterfaceAbi } from 'ethers';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import CustomButton from '../../components/buttons/CustomButton';
import { CopyableText } from '../../components/eth-mobile';
import SnowmanList from '../../components/SnowmanList';
import {
  useAccount,
  useDeployedContractInfo,
  useNetwork,
  useScaffoldWriteContract
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { truncateAddress } from '../../utils/eth-mobile';
import { FONT_SIZE } from '../../utils/styles';

export default function Home() {
  const toast = useToast();
  const account = useAccount();
  const network = useNetwork();
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const { data: snowmanContract, isLoading: isLoadingSnowmanContract } =
    useDeployedContractInfo({
      contractName: 'Snowman'
    });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: 'Snowman',
    gasLimit: BigInt('500000')
  });

  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const mint = async () => {
    try {
      setIsMinting(true);
      await writeContractAsync({
        functionName: 'mint',
        value: ethers.parseEther('0.02')
      });

      setBalance(balance + 1);
      toast.show('Minted One(1) Snowman☃️', {
        type: 'success',
        placement: 'top'
      });
    } catch (error) {
      toast.show(JSON.stringify(error), { type: 'danger', placement: 'top' });
      console.log('Minting Error: ', error);
    } finally {
      setIsMinting(false);
    }
  };

  const getSnowmanBalance = async () => {
    try {
      if (isLoadingSnowmanContract) return;
      if (!snowmanContract) {
        toast.show('Loading resources', { placement: 'top' });
        return;
      }

      setIsLoadingBalance(true);

      const provider = new ethers.JsonRpcProvider(network.provider);

      const snowman = new ethers.Contract(
        snowmanContract.address,
        snowmanContract.abi as InterfaceAbi,
        provider
      );
      const balance = await snowman.balanceOf(account.address);
      setBalance(Number(balance));
    } catch (error) {
      console.error(error);
      return;
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const refreshBalance = async () => {
    setIsRefreshing(true);
    await getSnowmanBalance();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!isFocused) return;
    getSnowmanBalance();
  }, [account, network, isLoadingSnowmanContract, isFocused]);

  if (!isFocused) return;
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refreshBalance}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.surface}>
        <Text style={styles.lightText}>Do you wanna build a</Text>
        <Text style={styles.boldText}>Snowman☃️</Text>
        {!!snowmanContract && (
          <CopyableText
            displayText={truncateAddress(snowmanContract.address)}
            value={snowmanContract.address}
            containerStyle={styles.addressContainer}
            textStyle={styles.addressText}
            iconStyle={{ color: COLORS.primary }}
          />
        )}

        <Text style={styles.centerText}>
          Mint a unique Snowman☃️ for{' '}
          <Text style={{ color: COLORS.primary }}>0.02 ETH</Text>
        </Text>

        <View style={styles.buttonContainer}>
          <CustomButton
            text="Mint"
            onPress={mint}
            style={styles.button}
            loading={isMinting}
          />

          <CustomButton
            text="Accessories"
            type="outline"
            onPress={() => navigation.navigate('Accessories' as never)}
            style={styles.button}
          />
        </View>
      </View>

      {isLoadingBalance && !isRefreshing ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <SnowmanList balance={balance} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  surface: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  lightText: {
    ...globalStyles.text,
    fontSize: FONT_SIZE.md
  },
  boldText: {
    ...globalStyles.textMedium,
    fontSize: FONT_SIZE.xl,
    marginLeft: 15
  },
  addressContainer: {
    paddingHorizontal: 15,
    paddingVertical: 2,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24
  },
  addressText: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.textMedium,
    marginBottom: -2,
    color: COLORS.primary
  },
  centerText: {
    textAlign: 'center',
    marginTop: 16,
    ...globalStyles.text,
    fontSize: FONT_SIZE.md,
    maxWidth: '70%'
  },
  button: {
    width: '50%',
    marginTop: 10
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10
  }
});
