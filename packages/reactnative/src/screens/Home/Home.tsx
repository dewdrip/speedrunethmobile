import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { Button, Card, Text } from 'react-native-paper';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { Address, Balance } from '../../components/eth-mobile';
import { Pool } from '../../components/Pool';
import {
  useAccount,
  useBalance,
  useCryptoPrice,
  useDeployedContractInfo,
  useNetwork,
  useScaffoldEventHistory,
  useScaffoldReadContract
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { parseBalance } from '../../utils/eth-mobile';
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
  const network = useNetwork();
  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const contractAddress = contractInfo?.address;

  const { balance, isRefetching, refetch } = useBalance({
    address: contractAddress as string,
    watch: true
  });

  const { price, fetchPrice } = useCryptoPrice({
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
            mode="outlined"
            style={[styles.actionButton, styles.secondaryButton]}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.buttonLabel}
          >
            Manage Signers
          </Button>
        </View>

        {/* Contract Info Section */}
        {contractAddress ? (
          <View style={styles.contractContainer}>
            <View style={styles.contractHeader}>
              <Text style={styles.contractTitle}>Wallet Details</Text>
            </View>

            <View style={styles.balanceContainer}>
              <Text variant="headlineLarge" style={styles.balanceText}>
                {balance !== null
                  ? `${Number(parseBalance(balance)).toLocaleString('en-US')} ${network.currencySymbol}`
                  : null}
              </Text>
            </View>

            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR Code</Text>
              <Text style={styles.qrSubtext}>Scan to send funds</Text>
            </View>

            <View style={styles.addressContainer}>
              <Address address={contractAddress} />
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
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
    flexDirection: 'column',
    gap: 16,
    marginBottom: 32
  },
  actionButton: {
    borderRadius: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600'
  },
  contractContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
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
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  contractTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed'
  },
  qrText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  qrSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary
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
    ...globalStyles.textMedium
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
