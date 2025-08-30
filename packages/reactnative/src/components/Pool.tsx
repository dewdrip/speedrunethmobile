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
        const res: { [key: string]: TransactionData } = await (
          await fetch(`${poolServerUrl}${contractInfo?.address}_${chainId}`)
        ).json();

        const newTransactions: TransactionData[] = [];
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const i in res) {
          const validSignatures = [];
          // eslint-disable-next-line guard-for-in, no-restricted-syntax
          for (const s in res[i].signatures) {
            const signer = (await metaMultiSigWallet?.read.recover([
              res[i].hash as `0x${string}`,
              res[i].signatures[s]
            ])) as `0x${string}`;

            const isOwner = await metaMultiSigWallet?.read.isOwner([
              signer as string
            ]);

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
        console.log(e);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.innerContainer}>
        <View style={styles.poolContainer}>
          <Text style={styles.title}>Pool</Text>

          <Text style={styles.nonce}>
            Nonce: {nonce !== undefined ? `#${nonce}` : 'Loading...'}
          </Text>

          <View style={styles.transactionsContainer}>
            {transactions === undefined ? (
              <Text>Loading...</Text>
            ) : (
              transactions.map(tx => (
                <TransactionItem
                  key={tx.hash}
                  tx={tx}
                  completed={historyHashes.includes(tx.hash as `0x${string}`)}
                  outdated={
                    lastTx?.nonce != undefined &&
                    BigInt(tx.nonce) <= BigInt(lastTx?.nonce)
                  }
                />
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%'
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 32
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center'
  },
  poolContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 8,
    borderColor: '#6366f1',
    borderRadius: 12,
    padding: 24,
    width: '100%'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  nonce: {
    fontSize: 16,
    marginTop: 8
  },
  transactionsContainer: {
    flexDirection: 'column',
    marginTop: 32,
    gap: 16,
    width: '100%'
  }
});
