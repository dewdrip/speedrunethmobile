import { useState, type FC } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Abi,
  decodeFunctionData,
  DecodeFunctionDataReturnType,
  formatEther
} from 'viem';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldReadContract,
  useSignMessage
} from '../hooks/eth-mobile';
import { Address } from './eth-mobile';

type TransactionItemProps = {
  tx: TransactionData;
  completed?: boolean;
  outdated?: boolean;
};

export type TransactionData = {
  chainId: number;
  address: string;
  nonce: bigint;
  to: string;
  amount: string;
  data: `0x${string}`;
  hash: `0x${string}`;
  signatures: `0x${string}`[];
  signers: string[];
  validSignatures?: { signer: string; signature: string }[];
  requiredApprovals: bigint;
};

export const TransactionItem: FC<TransactionItemProps> = ({
  tx,
  completed,
  outdated
}) => {
  const { address } = useAccount();
  const [modalVisible, setModalVisible] = useState(false);

  //const transactor = useTransactor();

  const poolServerUrl = 'http://localhost:49832/';

  const { data: signaturesRequired } = useScaffoldReadContract({
    contractName: 'MetaMultiSigWallet',
    functionName: 'signaturesRequired'
  });

  const { data: nonce } = useScaffoldReadContract({
    contractName: 'MetaMultiSigWallet',
    functionName: 'nonce'
  });

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractName: 'MetaMultiSigWallet'
  });

  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const txnData =
    contractInfo?.abi &&
    Array.isArray(contractInfo.abi) &&
    contractInfo.abi.length > 0 &&
    tx.data &&
    tx.data !== '0x'
      ? decodeFunctionData({ abi: contractInfo.abi as Abi, data: tx.data })
      : ({} as DecodeFunctionDataReturnType);

  const hasSigned = tx.signers.indexOf(address as string) >= 0;
  const hasEnoughSignatures = signaturesRequired
    ? tx.signatures.length >= Number(signaturesRequired)
    : false;

  const getSortedSigList = async (
    allSigs: `0x${string}`[],
    newHash: `0x${string}`
  ) => {
    const sigList = [];
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const s in allSigs) {
      const recover = (await metaMultiSigWallet?.read.recover([
        newHash,
        allSigs[s]
      ])) as `0x${string}`;

      sigList.push({ signature: allSigs[s], signer: recover });
    }

    sigList.sort((a, b) => {
      return BigInt(a.signer) > BigInt(b.signer) ? 1 : -1;
    });

    const finalSigList: `0x${string}`[] = [];
    const finalSigners: `0x${string}`[] = [];
    const used: Record<string, boolean> = {};
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const s in sigList) {
      if (!used[sigList[s].signature]) {
        finalSigList.push(sigList[s].signature);
        finalSigners.push(sigList[s].signer);
      }
      used[sigList[s].signature] = true;
    }

    return [finalSigList, finalSigners];
  };

  const { signMessage } = useSignMessage();

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalBody}>
              <Text
                style={[styles.boldText, { fontSize: 18, marginBottom: 16 }]}
              >
                Transaction Details
              </Text>

              <View style={styles.section}>
                <Text style={styles.boldText}>Function</Text>
                <View style={styles.functionNameContainer}>
                  <Text style={styles.functionNameText}>
                    {txnData.functionName || 'transferFunds'}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                {txnData.args ? (
                  <>
                    <Text style={styles.boldText}>Arguments</Text>
                    <View style={styles.row}>
                      <Text style={styles.labelText}>Updated signer:</Text>
                      <Address address={String(txnData.args?.[0])} />
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.labelText}>Required signatures:</Text>
                      <Text style={styles.boldText}>
                        {String(txnData.args?.[1])}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.boldText}>Transfer Details</Text>
                    <View style={styles.row}>
                      <Text style={styles.labelText}>To:</Text>
                      <Address address={tx.to} />
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.labelText}>Amount:</Text>
                      <Text style={styles.amountText}>
                        {formatEther(BigInt(tx.amount))} Ξ
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.boldText}>Transaction Hash</Text>
                <View style={styles.hashContainer}>
                  <Text style={styles.smallText}>{tx.hash}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.boldText}>Signatures</Text>
                <Text style={styles.signaturesText}>
                  {tx.signatures.length} of {String(tx.requiredApprovals)}{' '}
                  required
                </Text>
                {hasSigned && (
                  <Text style={[styles.smallText, { color: '#2E7D32' }]}>
                    ✅ You have signed this transaction
                  </Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.transactionItem}>
        <View style={styles.transactionHeader}>
          {/* Transaction Meta Info */}
          <View style={styles.transactionMeta}>
            <View style={styles.nonceContainer}>
              <Text style={styles.boldText}>#{String(tx.nonce)}</Text>
            </View>
            <View style={styles.hashContainer}>
              <Text style={styles.boldText}>{tx.hash.slice(0, 10)}...</Text>
            </View>
          </View>

          {/* Amount Display */}
          <View style={styles.amountContainer}>
            <View style={styles.row}>
              <Text style={styles.labelText}>To:</Text>
              <Address address={tx.to} />
            </View>
            <Text style={styles.amountText}>
              {formatEther(BigInt(tx.amount))} Ξ
            </Text>
          </View>

          {/* Status and Signatures */}
          <View style={styles.statusContainer}>
            {String(signaturesRequired) && (
              <View style={styles.signaturesContainer}>
                <Text style={styles.signaturesText}>
                  {tx.signatures.length}/{String(tx.requiredApprovals)}
                </Text>
                {hasSigned && <Text>✅</Text>}
              </View>
            )}

            {completed ? (
              <View style={[styles.statusBadge, styles.completedBadge]}>
                <Text style={[styles.statusText, styles.completedText]}>
                  Completed
                </Text>
              </View>
            ) : outdated ? (
              <View style={[styles.statusBadge, styles.outdatedBadge]}>
                <Text style={[styles.statusText, styles.outdatedText]}>
                  Outdated
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          {!completed && !outdated && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.button, hasSigned && styles.disabledButton]}
                disabled={hasSigned}
                onPress={async () => {
                  try {
                    // Safely convert amount to BigInt
                    let amountBigInt: bigint;
                    try {
                      const cleanAmount = tx.amount.toString().trim();
                      if (
                        !cleanAmount ||
                        cleanAmount === '0x' ||
                        cleanAmount === ''
                      ) {
                        throw new Error('Invalid amount format');
                      }
                      amountBigInt = BigInt(cleanAmount);
                    } catch (amountError) {
                      console.error(
                        'Error converting amount to BigInt:',
                        tx.amount,
                        amountError
                      );
                      Alert.alert(
                        'Error',
                        `Invalid transaction amount: ${tx.amount}`
                      );
                      return;
                    }

                    const newHash =
                      (await metaMultiSigWallet?.read.getTransactionHash([
                        nonce as bigint,
                        tx.to,
                        amountBigInt,
                        tx.data
                      ])) as `0x${string}`;

                    const signature = await signMessage({
                      message: newHash
                    });

                    const signer = await metaMultiSigWallet?.read.recover([
                      newHash,
                      signature
                    ]);

                    const isOwner = await metaMultiSigWallet?.read.isOwner([
                      signer as string
                    ]);

                    if (isOwner) {
                      const [finalSigList, finalSigners] =
                        await getSortedSigList(
                          [...tx.signatures, signature as `0x${string}`],
                          newHash
                        );

                      await fetch(poolServerUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(
                          {
                            ...tx,
                            signatures: finalSigList,
                            signers: finalSigners
                          },
                          // stringifying bigint
                          (_, value) =>
                            typeof value === 'bigint' ? value.toString() : value
                        )
                      });
                    } else {
                      Alert.alert('Info', 'Only owners can sign transactions');
                    }
                  } catch (e) {
                    Alert.alert('Error', 'Error signing transaction');
                    console.log(e);
                  }
                }}
              >
                <Text style={styles.buttonText}>
                  {hasSigned ? 'Signed' : 'Sign'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  !hasEnoughSignatures && styles.disabledButton
                ]}
                disabled={!hasEnoughSignatures}
                onPress={async () => {
                  try {
                    if (!contractInfo || !metaMultiSigWallet) {
                      console.log('No contract info');
                      return;
                    }

                    // Safely convert amount to BigInt
                    let amountBigInt: bigint;
                    try {
                      const cleanAmount = tx.amount.toString().trim();
                      if (
                        !cleanAmount ||
                        cleanAmount === '0x' ||
                        cleanAmount === ''
                      ) {
                        throw new Error('Invalid amount format');
                      }
                      amountBigInt = BigInt(cleanAmount);
                      console.log(
                        'Amount converted to BigInt:',
                        amountBigInt.toString()
                      );
                    } catch (amountError) {
                      console.error(
                        'Error converting amount to BigInt:',
                        tx.amount,
                        amountError
                      );
                      Alert.alert(
                        'Error',
                        `Invalid transaction amount: ${tx.amount}`
                      );
                      return;
                    }

                    const newHash =
                      (await metaMultiSigWallet.read.getTransactionHash([
                        nonce as bigint,
                        tx.to,
                        amountBigInt,
                        tx.data
                      ])) as `0x${string}`;

                    const [finalSigList] = await getSortedSigList(
                      tx.signatures,
                      newHash
                    );

                    console.log('Final sig list:', finalSigList);
                    console.log('tx:', tx.to);
                    console.log('amountBigInt', amountBigInt);

                    // TODO: Implement transactor or use direct contract call
                    await metaMultiSigWallet.write.executeTransaction([
                      tx.to,
                      amountBigInt,
                      tx.data,
                      finalSigList
                    ]);
                  } catch (e) {
                    Alert.alert('Error', 'Error executing transaction');
                    console.log('Full error details:', e);
                  }
                }}
              >
                <Text style={styles.buttonText}>Execute</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.buttonText}>⋯</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.transactionFooter}>
          <View style={styles.footerRow}>
            <Text style={styles.labelText}>Function:</Text>
            <View style={styles.functionNameContainer}>
              <Text style={styles.functionNameText}>
                {txnData.functionName || 'transferFunds'}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.labelText}>Target:</Text>
            <Address
              address={txnData.args?.[0] ? String(txnData.args?.[0]) : tx.to}
            />
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalBody: {
    flexDirection: 'column'
  },
  modalActions: {
    marginTop: 24,
    alignItems: 'flex-end'
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  transactionHeader: {
    flexDirection: 'column',
    gap: 12
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  nonceContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  hashContainer: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8
  },
  signaturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  signaturesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  completedBadge: {
    backgroundColor: '#E8F5E8'
  },
  outdatedBadge: {
    backgroundColor: '#FFF3E0'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  completedText: {
    color: '#2E7D32'
  },
  outdatedText: {
    color: '#F57C00'
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  transactionFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  section: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 20
  },
  boldText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333'
  },
  smallText: {
    fontSize: 12,
    color: '#666'
  },
  labelText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500'
  },
  marginTop: {
    marginTop: 8
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center'
  },
  disabledButton: {
    backgroundColor: '#CCCCCC'
  },
  moreButton: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  functionNameContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  functionNameText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500'
  }
});
