import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  useBalance,
  useDeployedContractInfo,
  useERC20Balance
} from '../../../hooks/eth-mobile';
import { parseBalance } from '../../../utils/eth-mobile';
import { FONT_SIZE } from '../../../utils/styles';

export default function Liquidity() {
  const { data: dexContract } = useDeployedContractInfo({
    contractName: 'DEX'
  });
  const { data: balloonContract } = useDeployedContractInfo({
    contractName: 'Balloons'
  });

  const { balance: dexETHBalance } = useBalance({
    // @ts-ignore
    address: dexContract?.address,
    watch: true
  });
  const { balance: dexBalloonBalance } = useERC20Balance({
    token: balloonContract?.address,
    userAddress: dexContract?.address,
    watch: true
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liquidity</Text>

      <View style={styles.balancesContainer}>
        <View style={styles.ethBalanceContainer}>
          <Image
            source={require('../../../assets/images/eth-icon.png')}
            style={styles.ethLogo}
          />

          <Text style={[styles.balance, { marginLeft: -5 }]}>
            {dexETHBalance !== null ? parseBalance(dexETHBalance) : null}
          </Text>
        </View>

        <Text style={styles.balance}>
          🎈{' '}
          {dexBalloonBalance !== null ? parseBalance(dexBalloonBalance) : null}
        </Text>
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
  balancesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },
  ethBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ethLogo: {
    width: FONT_SIZE['xl'] * 1.7,
    aspectRatio: 1,
    marginLeft: -10
  },
  balance: {
    fontSize: FONT_SIZE['xl']
  }
});
