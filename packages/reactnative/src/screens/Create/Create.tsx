import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { useIsMounted } from 'usehooks-ts';
import { Address, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { AddressInput, InputBase } from '../../components/eth-mobile';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldReadContract,
  useSignMessage
} from '../../hooks/eth-mobile';
import { COLORS } from '../../utils/constants';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../../utils/styles';

export type Method = 'transferFunds';
export const METHODS: Method[] = ['transferFunds'];

export const DEFAULT_TX_DATA = {
  methodName: 'transferFunds' as Method,
  signer: '',
  newSignaturesNumber: '',
  amount: '0',
  callData: '0x' as `0x${string}`
};

export type PredefinedTxData = {
  methodName: Method;
  signer: string;
  newSignaturesNumber: string;
  to?: string;
  amount?: string;
  callData?: `0x${string}` | '';
};

// Custom hook to replace useLocalStorage for React Native
function useAsyncStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = useCallback(
    async (value: T) => {
      try {
        setStoredValue(value);
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving to AsyncStorage:`, error);
      }
    },
    [key]
  );

  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error loading from AsyncStorage:`, error);
      }
    };

    loadStoredValue();
  }, [key]);

  return [storedValue, setValue];
}

export const PoorlServerUrl = 'http://localhost:49832/';

export type TransactionData = {
  chainId: number;
  address: Address;
  nonce: bigint;
  to: string;
  amount: string;
  data: `0x${string}`;
  hash: `0x${string}`;
  signatures: `0x${string}`[];
  signers: Address[];
  validSignatures?: { signer: Address; signature: Address }[];
  requiredApprovals: bigint;
};

export default function CreatePage() {
  const navigation = useNavigation();
  const chainId = 31337; // Hardhat chain ID
  const isMounted = useIsMounted();
  const [isCreating, setIsCreating] = useState(false);

  const { address } = useAccount();

  const poolServerUrl = PoorlServerUrl;

  const [ethValue, setEthValue] = useState('');
  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const [predefinedTxData, setPredefinedTxData] =
    useAsyncStorage<PredefinedTxData>('predefined-tx-data', {
      methodName: 'transferFunds',
      signer: '',
      newSignaturesNumber: '',
      amount: '0',
      callData: '0x'
    });

  const { data: nonce } = useScaffoldReadContract({
    contractName: 'MetaMultiSigWallet',
    functionName: 'nonce'
  });

  const { data: signaturesRequired } = useScaffoldReadContract({
    contractName: 'MetaMultiSigWallet',
    functionName: 'signaturesRequired'
  });

  const txTo =
    predefinedTxData.methodName === 'transferFunds'
      ? predefinedTxData.signer
      : contractInfo?.address;

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractName: 'MetaMultiSigWallet'
  });

  const { signMessage } = useSignMessage();

  const handleCreate = async () => {
    try {
      setIsCreating(true);

      if (!metaMultiSigWallet) {
        Alert.alert('Error', 'Contract not loaded yet');
        return;
      }

      if (
        nonce === undefined ||
        nonce === null ||
        !txTo ||
        !predefinedTxData.amount
      ) {
        Alert.alert('Error', 'Missing required transaction data');
        return;
      }

      const getTransactionHashCall = metaMultiSigWallet.read.getTransactionHash(
        [
          nonce as bigint,
          String(txTo),
          BigInt(predefinedTxData.amount as string),
          (predefinedTxData.callData || '0x') as `0x${string}`
        ]
      );

      if (!getTransactionHashCall) {
        Alert.alert('Error', 'Failed to Transfer hash call');
        return;
      }

      const newHash = (await getTransactionHashCall) as `0x${string}`;

      const signature = await signMessage({ message: newHash });

      const recoverCall = metaMultiSigWallet.read.recover([newHash, signature]);

      if (!recoverCall) {
        Alert.alert('Error', 'Failed to create recover call');
        return;
      }

      const recover = (await recoverCall) as Address;

      const isOwnerCall = metaMultiSigWallet.read.isOwner([recover]);

      if (!isOwnerCall) {
        Alert.alert('Error', 'Failed to create isOwner call');
        return;
      }

      const isOwner = await isOwnerCall;

      if (isOwner) {
        if (!contractInfo?.address || !predefinedTxData.amount || !txTo) {
          return;
        }

        const txData: TransactionData = {
          chainId: chainId,
          address: contractInfo.address,
          nonce: nonce || 0n,
          to: txTo,
          amount: predefinedTxData.amount,
          data: (predefinedTxData.callData || '0x') as `0x${string}`,
          hash: newHash,
          signatures: [signature as `0x${string}`],
          signers: [recover],
          requiredApprovals: signaturesRequired || 0n
        };

        await fetch(poolServerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            txData,
            // stringifying bigint
            (key, value) =>
              typeof value === 'bigint' ? value.toString() : value
          )
        });

        setPredefinedTxData(DEFAULT_TX_DATA);
        setEthValue('');

        // Show success message and go back
        Alert.alert('Success', 'Transaction created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        Alert.alert('Info', 'Only owners can propose transactions');
      }
    } catch (e) {
      Alert.alert('Error', 'Error while proposing transaction');
      console.log(e);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (
      predefinedTxData &&
      !predefinedTxData.callData &&
      predefinedTxData.methodName !== 'transferFunds'
    ) {
      setPredefinedTxData({
        ...predefinedTxData,
        methodName: 'transferFunds',
        callData: ''
      });
    }
  }, [predefinedTxData, setPredefinedTxData]);

  return isMounted() ? (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isCreating}
        >
          <Ionicons
            name="arrow-back"
            size={WINDOW_WIDTH * 0.06}
            color={isCreating ? COLORS.textSecondary : COLORS.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.innerContainer}>
          <View style={styles.formContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nonce</Text>
              <InputBase
                disabled
                value={nonce !== undefined ? `# ${nonce}` : 'Loading...'}
                placeholder={'Loading...'}
                onChange={() => {
                  null;
                }}
              />
            </View>

            <View style={styles.fieldsContainer}>
              <AddressInput
                placeholder={
                  predefinedTxData.methodName === 'transferFunds'
                    ? 'Recipient address'
                    : 'Signer address'
                }
                value={predefinedTxData.signer}
                onChange={signer =>
                  setPredefinedTxData({ ...predefinedTxData, signer: signer })
                }
              />

              {predefinedTxData.methodName === 'transferFunds' && (
                <TextInput
                  label="Amount (ETH)"
                  value={ethValue}
                  onChangeText={val => {
                    setPredefinedTxData({
                      ...predefinedTxData,
                      amount: String(parseEther(val || '0'))
                    });
                    setEthValue(val);
                  }}
                  mode="outlined"
                  keyboardType="numeric"
                />
              )}

              <InputBase
                value={predefinedTxData.callData || ''}
                placeholder={'Calldata'}
                onChange={() => {
                  null;
                }}
                disabled
              />

              <Button
                mode="contained"
                disabled={
                  isCreating ||
                  !metaMultiSigWallet ||
                  nonce === undefined ||
                  nonce === null ||
                  !contractInfo
                }
                onPress={handleCreate}
                style={styles.createButton}
                loading={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Ionicons
            name="home-outline"
            size={WINDOW_WIDTH * 0.06}
            color="grey"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('DebugContracts' as never)}
        >
          <Ionicons
            name="bug-outline"
            size={WINDOW_WIDTH * 0.06}
            color="grey"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Wallet' as never)}
        >
          <Ionicons
            name="wallet-outline"
            size={WINDOW_WIDTH * 0.06}
            color="grey"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Ionicons
            name="settings-outline"
            size={WINDOW_WIDTH * 0.06}
            color="grey"
          />
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {isCreating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Creating transaction...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      )}
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151'
  },
  headerSpacer: {
    width: WINDOW_WIDTH * 0.06 + 16 // Same width as back button to center title
  },
  scrollContainer: {
    flex: 1
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%'
  },
  formContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    margin: 16
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 16
  },
  fieldsContainer: {
    flexDirection: 'column',
    gap: 16,
    width: '100%'
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151'
  },
  pickerContainer: {
    flexDirection: 'column',
    gap: 8
  },
  methodButton: {
    marginVertical: 2
  },
  createButton: {
    marginTop: 16
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingBottom: 0,
    height: WINDOW_HEIGHT * 0.07,
    alignItems: 'center'
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center'
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center'
  }
});
