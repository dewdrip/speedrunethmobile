import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { Address, Balance } from '../../components/eth-mobile';
import { Pool } from '../../components/Pool';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldEventHistory,
  useScaffoldReadContract
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { FONT_SIZE, WINDOW_WIDTH } from '../../utils/styles';

type Props = {};

function HighlightedText({ children }: { children: string }) {
  return (
    <View
      style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: 4 }}
    >
      <Text
        style={{
          textAlign: 'center',
          fontSize: FONT_SIZE['md'],
          ...globalStyles.text
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export default function Home({}: Props) {
  const navigation = useNavigation();
  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const contractAddress = contractInfo?.address;

  const { data: executeTransactionEvents } = useScaffoldEventHistory({
    contractName: 'MetaMultiSigWallet',
    eventName: 'ExecuteTransaction',
    fromBlock: 0n
  });

  // Placeholder variables - replace with your actual state/data
  const multisigsLoading = false;
  const registryAddressLoading = false;
  const multisigs: string[] = [];
  const connectedAddress = null;

  return (
    <View style={styles.mainContainer}>
      {contractAddress ? (
        <View style={styles.qrContainer}>
          <Balance address={contractAddress} />
          <Text>QR Code would go here</Text>
          <Address address={contractAddress} />
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading contract...</Text>
        </View>
      )}

      {contractAddress && (
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Events:</Text>
          {executeTransactionEvents?.map((txEvent, index) => (
            <Text key={index}>
              Transaction Event: {JSON.stringify(txEvent.args)}
            </Text>
          ))}
        </View>
      )}

      <Pool />

      <View style={styles.buttonsContainer}>
        <Button
          onPress={() => navigation.navigate('Create' as never)}
          mode="contained"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Create Transaction
        </Button>

        <Button
          onPress={() => navigation.navigate('ManageSigners' as never)}
          mode="outlined"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          Manage Signers
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... your existing styles
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    marginVertical: 80, // my-20 equivalent (20 * 4px = 80px)
    paddingHorizontal: 16, // Add horizontal padding to the main container
    gap: 12 // gap-8 equivalent (8 * 4px = 32px)
  },
  qrContainer: {
    flexDirection: 'column',
    gap: 16, // gap-4 equivalent
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // base-100 equivalent
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
    borderWidth: 8,
    borderColor: '#6366f1', // secondary color equivalent
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320 // max-w-lg equivalent (~20rem)
  },
  eventsContainer: {
    flexDirection: 'column',
    marginTop: 40, // mt-10 equivalent
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 8,
    borderColor: '#6366f1',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 768 // max-w-3xl equivalent (~48rem)
  },
  eventsTitle: {
    fontSize: 20, // text-xl equivalent
    fontWeight: 'bold',
    marginVertical: 8 // my-2 equivalent
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  actionButton: {
    minWidth: 160,
    maxWidth: 200
  },
  actionButtonContent: {
    paddingVertical: 6,
    paddingHorizontal: 12
  }
});
