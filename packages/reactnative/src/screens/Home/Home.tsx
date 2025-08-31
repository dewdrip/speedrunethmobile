import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { Button, Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { Address } from '../../components/eth-mobile';
import { Pool } from '../../components/Pool';
import {
  useBalance,
  useCryptoPrice,
  useDeployedContractInfo,
  useNetwork
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { parseBalance } from '../../utils/eth-mobile';

type Props = {};

export default function Home({}: Props) {
  const navigation = useNavigation();
  const network = useNetwork();
  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const contractAddress = contractInfo?.address;

  const { balance, isRefetching, refetch } = useBalance({
    address: contractAddress as string,
    watch: true
  });

  const { fetchPrice } = useCryptoPrice({
    priceID: network.coingeckoPriceId,
    enabled: false
  });

  useEffect(() => {
    if (!!balance && parseBalance(balance).length > 0) return;
    fetchPrice();
  }, [balance, network]);

  const refresh = () => {
    refetch();
    fetchPrice();
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.mainContainer}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Multi-Sig Wallet</Text>
          <Text style={styles.headerSubtitle}>
            Manage your transactions securely
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            onPress={() => navigation.navigate('Create' as never)}
            mode="contained"
            style={[styles.actionButton, styles.primaryButton]}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.buttonLabel}
          >
            Transfer
          </Button>

          <Button
            onPress={() => navigation.navigate('ManageSigners' as never)}
            mode="contained"
            style={[styles.actionButton, styles.primaryButton]}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.buttonLabel}
          >
            Signers
          </Button>
          <Button
            onPress={() => navigation.navigate('Events' as never)}
            mode="contained"
            style={[styles.actionButton, styles.primaryButton]}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.buttonLabel}
          >
            Events
          </Button>
        </View>

        {/* Contract Info Section */}
        {contractAddress ? (
          <View style={styles.contractContainer}>
            <View style={styles.contractHeader}>
              <Text variant="headlineLarge" style={styles.balanceText}>
                {balance !== null
                  ? `${Number(parseBalance(balance)).toLocaleString('en-US')} ${network.currencySymbol}`
                  : null}
              </Text>

              <View style={styles.addressContainer}>
                <Address address={contractAddress} />
              </View>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={contractAddress}
                  size={140}
                  color={COLORS.text}
                  backgroundColor={COLORS.surface}
                />
              </View>
              <Text style={styles.qrSubtext}>Scan to send funds</Text>
            </View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading contract...</Text>
          </View>
        )}

        {/* Pool Section */}
        <View style={styles.poolContainer}>
          <Pool />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingTop: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.8
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32
  },
  actionButton: {
    borderRadius: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  primaryButton: {
    backgroundColor: COLORS.primary
  },
  secondaryButton: {
    borderColor: COLORS.primary,
    borderWidth: 2
  },
  actionButtonContent: {
    paddingVertical: 2,
    paddingHorizontal: 2
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600'
  },
  contractContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  contractHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: COLORS.text
  },
  balanceContainer: {},
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  qrSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500'
  },
  addressContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 24
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary
  },
  poolContainer: {
    marginTop: 8
  },
  balanceText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8
  },
  eventsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center'
  }
});
