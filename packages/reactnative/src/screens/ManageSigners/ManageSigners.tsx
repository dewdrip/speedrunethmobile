import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from 'react-native-paper';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { useIsMounted, useLocalStorage } from 'usehooks-ts';
import { Address, createWalletClient, encodeFunctionData, http } from 'viem';
import { AddressInput, InputBase } from '../../components/eth-mobile';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldReadContract
} from '../../hooks/eth-mobile';
import { COLORS } from '../../utils/constants';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../../utils/styles';

export type SignerMethod = 'addSigner' | 'removeSigner';
export const SIGNER_METHODS: SignerMethod[] = ['addSigner', 'removeSigner'];

export const DEFAULT_SIGNER_DATA = {
  methodName: 'addSigner' as SignerMethod,
  signer: '',
  newSignaturesNumber: ''
};

export type PredefinedSignerData = {
  methodName: SignerMethod;
  signer: string;
  newSignaturesNumber: string;
  callData?: `0x${string}` | '';
};

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

export default function ManageSignersPage() {
  const navigation = useNavigation();
  const chainId = 31337; // Hardhat chain ID
  const isMounted = useIsMounted();

  const { address } = useAccount();

  const walletClient = address
    ? createWalletClient({
        account: address as `0x${string}`,
        transport: http('http://127.0.0.1:8545') // Hardhat local RPC URL
      })
    : null;

  const poolServerUrl = PoorlServerUrl;

  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const [predefinedSignerData, setPredefinedSignerData] =
    useLocalStorage<PredefinedSignerData>('predefined-signer-data', {
      methodName: 'addSigner',
      signer: '',
      newSignaturesNumber: '',
      callData: ''
    });

  const { data: nonce } = useScaffoldReadContract({
    contractName: 'MetaMultiSigWallet',
    functionName: 'nonce'
  });

  const { data: signaturesRequired } = useScaffoldReadContract({
    contractName: 'MetaMultiSigWallet',
    functionName: 'signaturesRequired'
  });

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractName: 'MetaMultiSigWallet'
  });

  // Generate callData based on method and signer address
  const generateCallData = (
    method: SignerMethod,
    signerAddress: string
  ): `0x${string}` => {
    if (!signerAddress || !contractInfo?.abi) return '' as `0x${string}`;

    try {
      if (method === 'addSigner') {
        return encodeFunctionData({
          abi: contractInfo.abi,
          functionName: 'addSigner',
          args: [signerAddress as Address]
        });
      } else if (method === 'removeSigner') {
        return encodeFunctionData({
          abi: contractInfo.abi,
          functionName: 'removeSigner',
          args: [signerAddress as Address]
        });
      }
    } catch (error) {
      console.log('Error generating callData:', error);
    }

    return '' as `0x${string}`;
  };

  const handleCreate = async () => {
    try {
      if (!walletClient) {
        console.log('No wallet client!');
        return;
      }

      if (!predefinedSignerData.signer) {
        Alert.alert('Error', 'Please enter a signer address');
        return;
      }

      const callData = generateCallData(
        predefinedSignerData.methodName,
        predefinedSignerData.signer
      );

      if (!callData) {
        Alert.alert('Error', 'Failed to generate transaction data');
        return;
      }

      const newHash = (await metaMultiSigWallet?.read.getTransactionHash([
        nonce as bigint,
        String(contractInfo?.address),
        0n, // No ETH amount for signer operations
        callData
      ])) as `0x${string}`;

      const signature = await walletClient.signMessage({
        message: { raw: newHash }
      });

      const recover = (await metaMultiSigWallet?.read.recover([
        newHash,
        signature
      ])) as Address;

      const isOwner = await metaMultiSigWallet?.read.isOwner([recover]);

      if (isOwner) {
        if (!contractInfo?.address) {
          return;
        }

        const txData: TransactionData = {
          chainId: chainId,
          address: contractInfo.address,
          nonce: nonce || 0n,
          to: contractInfo.address, // Transaction to the contract itself
          amount: '0', // No ETH transfer
          data: callData,
          hash: newHash,
          signatures: [signature],
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

        setPredefinedSignerData(DEFAULT_SIGNER_DATA);

        setTimeout(() => {
          navigation.navigate('Pool' as never);
        }, 777);
      } else {
        Alert.alert('Info', 'Only owners can propose signer changes');
      }
    } catch (e) {
      Alert.alert('Error', 'Error while proposing signer change');
      console.log(e);
    }
  };

  // Update callData when method or signer changes
  useEffect(() => {
    if (
      predefinedSignerData.signer &&
      predefinedSignerData.methodName &&
      contractInfo?.abi
    ) {
      const callData = generateCallData(
        predefinedSignerData.methodName,
        predefinedSignerData.signer
      );
      setPredefinedSignerData({
        ...predefinedSignerData,
        callData
      });
    }
  }, [
    predefinedSignerData.methodName,
    predefinedSignerData.signer,
    contractInfo
  ]);

  return isMounted() ? (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={WINDOW_WIDTH * 0.06}
            color={COLORS.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Signers</Text>
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
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Select method</Text>
                <View style={styles.pickerContainer}>
                  {SIGNER_METHODS.map(method => (
                    <Button
                      key={method}
                      mode={
                        predefinedSignerData.methodName === method
                          ? 'contained'
                          : 'outlined'
                      }
                      onPress={() =>
                        setPredefinedSignerData({
                          ...predefinedSignerData,
                          methodName: method,
                          callData: '' as `0x${string}`
                        })
                      }
                      style={styles.methodButton}
                    >
                      {method}
                    </Button>
                  ))}
                </View>
              </View>

              <AddressInput
                placeholder="Signer address"
                value={predefinedSignerData.signer}
                onChange={signer =>
                  setPredefinedSignerData({
                    ...predefinedSignerData,
                    signer: signer
                  })
                }
              />

              <InputBase
                value={predefinedSignerData.callData || ''}
                placeholder={'Calldata'}
                onChange={() => {
                  null;
                }}
                disabled
              />

              <Button
                mode="contained"
                disabled={!walletClient || !predefinedSignerData.signer}
                onPress={handleCreate}
                style={styles.createButton}
              >
                Create Signer Transaction
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
  }
});
