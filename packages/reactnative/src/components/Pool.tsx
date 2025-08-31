import { useMemo, useState, type FC } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInterval } from 'usehooks-ts';
import {
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldEventHistory,
  useScaffoldReadContract
} from '../hooks/eth-mobile';
import { PoorlServerUrl } from '../screens/Create/Create';
import { TransactionData, TransactionItem } from './TransactionItem';

export const Pool: FC = () => {
  const [transactions, setTransactions] = useState<TransactionData[]>();
  const { data: contractInfo } = useDeployedContractInfo({
    contractName: 'MetaMultiSigWallet'
  });

  const poolServerUrl = PoorlServerUrl;
  const chainId = 31337; // Hardhat chain ID
  const { data: nonce } = useScaffoldReadContract({
    contractName: 'MetaMultiSigWallet',
    functionName: 'nonce'
  });

  const { data: eventsHistory } = useScaffoldEventHistory({
    contractName: 'MetaMultiSigWallet',
    eventName: 'ExecuteTransaction',
    fromBlock: 0n,
    watch: true
  });

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractName: 'MetaMultiSigWallet'
  });

  const historyHashes = useMemo(
    () => eventsHistory?.map(ev => (ev.args as any).hash) || [],
    [eventsHistory]
  );

  useInterval(() => {
    const getTransactions = async () => {
      try {
        if (!contractInfo?.address || !metaMultiSigWallet) {
          console.log('Contract not ready yet');
          return;
        }

        const res: { [key: string]: TransactionData } = await (
          await fetch(`${poolServerUrl}${contractInfo?.address}_${chainId}`)
        ).json();

        const newTransactions: TransactionData[] = [];
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const i in res) {
          const validSignatures = [];
          // eslint-disable-next-line guard-for-in, no-restricted-syntax
          for (const s in res[i].signatures) {
            const recoverCall = metaMultiSigWallet.read.recover([
              res[i].hash as `0x${string}`,
              res[i].signatures[s]
            ]);

            if (!recoverCall) {
              console.log('Failed to create recover call');
              continue;
            }

            const signer = (await recoverCall) as `0x${string}`;

            const isOwnerCall = metaMultiSigWallet.read.isOwner([
              signer as string
            ]);

            if (!isOwnerCall) {
              console.log('Failed to create isOwner call');
              continue;
            }

            const isOwner = await isOwnerCall;

            if (signer && isOwner) {
              validSignatures.push({ signer, signature: res[i].signatures[s] });
            }
          }
          const update: TransactionData = { ...res[i], validSignatures };
          newTransactions.push(update);
        }

        setTransactions(newTransactions);
      } catch (e) {
        //Alert.alert('Error', 'Error fetching transactions');
        console.log('Error fetching transactions:', e);
      }
    };

    getTransactions();
  }, 10777);

  const lastTx = useMemo(
    () =>
      transactions
        ?.filter(tx => historyHashes.includes(tx.hash))
        .sort((a, b) => (BigInt(a.nonce) < BigInt(b.nonce) ? 1 : -1))[0],
    [historyHashes, transactions]
  );

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.poolContainer}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Transaction Pool</Text>
              <View style={styles.nonceContainer}>
                <Text style={styles.nonce}>
                  {nonce !== undefined
                    ? `Current Nonce: #${nonce}`
                    : 'Loading nonce...'}
                </Text>
              </View>
            </View>
          </View>

          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            {transactions === undefined ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>
                  No pending transactions found.{'\n'}
                  Create a new transaction to get started.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pending Transactions</Text>
                  <Text style={styles.transactionCount}>
                    {transactions.length} transaction
                    {transactions.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                <ScrollView
                  style={styles.transactionsContainer}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                >
                  {transactions.map(tx => (
                    <TransactionItem
                      key={tx.hash}
                      tx={tx}
                      completed={historyHashes.includes(
                        tx.hash as `0x${string}`
                      )}
                      outdated={
                        lastTx?.nonce != undefined &&
                        BigInt(tx.nonce) <= BigInt(lastTx?.nonce)
                      }
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    width: '100%'
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20
  },
  innerContainer: {
    flex: 1,
    width: '100%'
  },
  poolContainer: {
    flex: 1,
    width: '100%'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  headerContent: {
    alignItems: 'flex-start',
    gap: 8
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  nonceContainer: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8
  },
  nonce: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5'
  },
  transactionsSection: {
    flex: 1,
    paddingTop: 16
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4
  },
  transactionCount: {
    fontSize: 14,
    color: '#6B7280'
  },
  transactionsContainer: {
    paddingHorizontal: 4
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5
  }
});
