import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { Address as AddressType, formatEther } from 'viem';
import { Address, Blockie } from '../../components/eth-mobile';
import { useScaffoldEventHistory } from '../../hooks/eth-mobile';
import { COLORS } from '../../utils/constants';
import { WINDOW_WIDTH } from '../../utils/styles';

// Props for a single transaction event item card.
type TransactionEventItemProps = {
  hash: `0x${string}`;
  nonce: bigint;
  owner: AddressType;
  to: AddressType;
  value: bigint;
};

/**
 * A component to display the details of a single transaction event.
 */
function TransactionEventItem({
  hash,
  nonce,
  owner,
  to,
  value
}: TransactionEventItemProps) {
  return (
    <View style={styles.itemCard}>
      <Text style={styles.nonce}># {String(nonce)}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Tx </Text>
        <Blockie size={20} address={hash} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>To </Text>
        <Address address={to} />
      </View>

      <Text style={styles.value}>{formatEther(value)} Ξ</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Executed by </Text>
        <Address address={owner} />
      </View>
    </View>
  );
}

/**
 * The main screen component that fetches and displays a list of events.
 */
export default function Events() {
  const { data: executeTransactionEvents, isLoading } = useScaffoldEventHistory(
    {
      contractName: 'MetaMultiSigWallet',
      eventName: 'ExecuteTransaction',
      fromBlock: 0n
    }
  );

  // Display a loading indicator while fetching data.
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.heading}>Fetching events...</Text>
      </View>
    );
  }

  // Display a message if no events are found.
  if (!executeTransactionEvents || executeTransactionEvents.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.heading}>No transaction events found.</Text>
      </View>
    );
  }

  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <Text style={styles.headerTitle}>Transaction Events</Text>
        <View style={styles.headerSpacer} />
      </View>

      {executeTransactionEvents.map(txEvent => {
        // Ensure the event and its arguments are defined before rendering.
        if (!txEvent.args) {
          return null;
        }

        return (
          <TransactionEventItem
            // Use the unique transaction hash as the key for stable identity.
            key={txEvent.transactionHash}
            hash={txEvent.transactionHash as `0x${string}`}
            // Pass props explicitly for better type safety and clarity.
            nonce={txEvent.args.nonce}
            owner={txEvent.args.owner}
            to={txEvent.args.to}
            value={txEvent.args.value}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12
  },
  itemCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2
  },
  backButton: {
    padding: 8
  },
  nonce: {
    fontWeight: '600',
    marginBottom: 8
  },
  label: {
    fontWeight: '400',
    color: '#666',
    marginRight: 4
  },
  value: {
    fontWeight: '500'
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151'
  },
  headerSpacer: {
    width: WINDOW_WIDTH * 0.06 + 16 // Same width as back button to center title
  }
});
