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
import { useIsMounted } from 'usehooks-ts';
import { encodeFunctionData } from 'viem';
import { Address, AddressInput, InputBase } from '../../components/eth-mobile';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useSignMessage
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
  address: `0x${string}`;
  nonce: bigint;
  to: string;
  amount: string;
  data: `0x${string}`;
  hash: `0x${string}`;
  signatures: `0x${string}`[];
  signers: `0x${string}`[];
  validSignatures?: { signer: `0x${string}`; signature: `0x${string}` }[];
  requiredApprovals: bigint;
};

export default function ManageSignersPage() {
  const navigation = useNavigation();
  const chainId = 31337; // Hardhat chain ID
  const isMounted = useIsMounted();

  const { address } = useAccount();
  const [operationMode, setOperationMode] = useState<'add' | 'remove'>('add');

  const poolServerUrl = PoorlServerUrl;

  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const [predefinedSignerData, setPredefinedSignerData] =
    useState<PredefinedSignerData>({
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

  const { data: ownerEventsHistory } = useScaffoldEventHistory({
    contractName: 'MetaMultiSigWallet',
    eventName: 'Owner',
    fromBlock: 0n // Start from genesis block, or use a specific block number
  });

  // Generate callData based on method and signer address
  const generateCallData = (
    method: SignerMethod,
    signerAddress: string,
    newSignaturesRequired?: string
  ): `0x${string}` => {
    if (!signerAddress || !contractInfo?.abi) return '' as `0x${string}`;

    try {
      // Use current signatures required as default if not provided
      const signaturesRequiredValue = newSignaturesRequired
        ? BigInt(newSignaturesRequired)
        : signaturesRequired || 1n;

      if (method === 'addSigner') {
        return encodeFunctionData({
          abi: contractInfo.abi,
          functionName: 'addSigner',
          args: [signerAddress as `0x${string}`, signaturesRequiredValue]
        });
      } else if (method === 'removeSigner') {
        return encodeFunctionData({
          abi: contractInfo.abi,
          functionName: 'removeSigner',
          args: [signerAddress as `0x${string}`, signaturesRequiredValue]
        });
      }
    } catch (error) {
      console.error('Error generating callData:', error);
    }

    return '' as `0x${string}`;
  };

  const { signMessage } = useSignMessage();

  const handleCreate = async () => {
    try {
      if (!predefinedSignerData.signer) {
        Alert.alert('Error', 'Please enter a signer address');
        return;
      }

      if (!predefinedSignerData.newSignaturesNumber) {
        Alert.alert('Error', 'Please enter the new signatures required');
        return;
      }

      const callData = generateCallData(
        predefinedSignerData.methodName,
        predefinedSignerData.signer,
        predefinedSignerData.newSignaturesNumber
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

      const signature = await signMessage({ message: newHash });

      const recover = (await metaMultiSigWallet?.read.recover([
        newHash,
        signature
      ])) as `0x${string}`;

      const isOwner = await metaMultiSigWallet?.read.isOwner([recover]);

      console.log('isOwner', isOwner, 'recover', recover, 'address', address);

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

        setPredefinedSignerData(DEFAULT_SIGNER_DATA);

        // Show success message and go back
        Alert.alert('Success', 'Transaction created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        Alert.alert('Info', 'Only owners can propose signer changes');
      }
    } catch (e) {
      Alert.alert('Error', 'Error while proposing signer change');
      console.log(e);
    }
  };

  // Sync operation mode with predefined signer data on mount
  // useEffect(() => {
  //   if (predefinedSignerData.methodName === 'removeSigner') {
  //     setOperationMode('remove');
  //   } else {
  //     setOperationMode('add');
  //   }
  // }, []);

  // Update callData when method or signer changes
  useEffect(() => {
    if (predefinedSignerData.signer && predefinedSignerData.methodName) {
      const callData = generateCallData(
        predefinedSignerData.methodName,
        predefinedSignerData.signer,
        predefinedSignerData.newSignaturesNumber
      );

      console.log('callData', callData);

      // Only update if callData has actually changed to prevent infinite loops
      if (callData && callData !== predefinedSignerData.callData) {
        setPredefinedSignerData(prev => ({
          ...prev,
          callData
        }));
      }
    }
  }, [
    predefinedSignerData.methodName,
    predefinedSignerData.signer,
    predefinedSignerData.newSignaturesNumber,
    signaturesRequired
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
          <View style={styles.ownerEventsContainer}>
            <Text style={styles.sectionTitle}>Recent Signer Changes</Text>
            {ownerEventsHistory && ownerEventsHistory.length > 0 ? (
              ownerEventsHistory.map((event, i) => {
                const isAdded = event.args?.added;
                const ownerAddress = event.args?.owner;

                return (
                  <View key={i} style={styles.ownerEventItem}>
                    <View style={styles.eventContent}>
                      <View style={styles.addressContainer}>
                        <Ionicons
                          name="wallet-outline"
                          size={18}
                          color={COLORS.primary}
                        />
                        <Address address={ownerAddress} />
                      </View>

                      <View style={styles.eventHeader}>
                        <View
                          style={[
                            styles.statusBadge,
                            isAdded ? styles.addedBadge : styles.removedBadge
                          ]}
                        >
                          <Ionicons
                            name={isAdded ? 'person-add' : 'person-remove'}
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.statusText}>
                            {isAdded ? 'Added' : 'Removed'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No signer changes yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Signer additions and removals will appear here
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.nonceContainer}>
              <Text style={styles.label}>Nonce</Text>
              <Text style={styles.label}>
                {nonce !== undefined ? `# ${nonce}` : 'Loading...'}
              </Text>
            </View>

            <View style={styles.fieldsContainer}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Select operation</Text>
                <View style={styles.pickerContainer}>
                  <Button
                    mode={operationMode === 'add' ? 'contained' : 'outlined'}
                    onPress={() => {
                      setOperationMode('add');
                      setPredefinedSignerData(prev => ({
                        ...prev,
                        methodName: 'addSigner'
                      }));
                    }}
                    style={styles.methodButton}
                  >
                    Add Signer
                  </Button>
                  <Button
                    mode={operationMode === 'remove' ? 'contained' : 'outlined'}
                    onPress={() => {
                      setOperationMode('remove');
                      setPredefinedSignerData(prev => ({
                        ...prev,
                        methodName: 'removeSigner'
                      }));
                    }}
                    style={styles.methodButton}
                  >
                    Remove Signer
                  </Button>
                </View>
              </View>

              {operationMode === 'add' && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Method</Text>
                  <View style={styles.pickerContainer}>
                    <Button mode="contained" style={styles.methodButton}>
                      addSigner
                    </Button>
                  </View>
                </View>
              )}

              {operationMode === 'remove' && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Method</Text>
                  <View style={styles.pickerContainer}>
                    <Button mode="contained" style={styles.methodButton}>
                      removeSigner
                    </Button>
                  </View>
                </View>
              )}

              <AddressInput
                placeholder="Signer address"
                value={predefinedSignerData.signer}
                onChange={signer =>
                  setPredefinedSignerData(prev => ({
                    ...prev,
                    signer: signer
                  }))
                }
              />

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>New Signatures Required</Text>
                <InputBase
                  value={predefinedSignerData.newSignaturesNumber}
                  placeholder={`Current: ${signaturesRequired || 'Loading...'}`}
                  onChange={(text: string) => {
                    console.log('text', text);
                    setPredefinedSignerData({
                      ...predefinedSignerData,
                      newSignaturesNumber: text // Only allow numbers
                    });
                  }}
                />
              </View>

              <InputBase
                value={predefinedSignerData.callData || ''}
                placeholder={'Calldata'}
                onChange={() => {
                  null;
                }}
                disabled
              />

              <View style={styles.createButtonContainer}>
                <Button
                  mode="contained"
                  disabled={
                    !predefinedSignerData.signer ||
                    !predefinedSignerData.newSignaturesNumber ||
                    predefinedSignerData.newSignaturesNumber.trim() === ''
                  }
                  onPress={handleCreate}
                  style={styles.createButton}
                >
                  {operationMode === 'add'
                    ? 'Create Add Signer Tx Proposal'
                    : 'Create Remove Signer Tx Proposal'}
                </Button>
              </View>
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
    marginTop: 16,
    borderWidth: 1,
    borderBlockColor: '#808080',
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%'
  },
  ownersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5'
  },
  nonceContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  ownerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  ownerAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1
  },
  ownerStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8
  },
  createButtonContainer: { padding: 10 },
  noOwnersText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic'
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
  ownerEventsContainer: {
    marginTop: 24,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center'
  },
  ownerEventItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  eventContent: {
    paddingHorizontal: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center'
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  addedBadge: {
    backgroundColor: '#10B981'
  },
  removedBadge: {
    backgroundColor: '#EF4444'
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  eventTimestamp: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500'
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  ownerAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    fontFamily: 'monospace'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center'
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20
  }
});
