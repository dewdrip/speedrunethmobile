import { formatEther } from 'ethers';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import {
  useAccount,
  useDeployedContractInfo,
  useScaffoldContractRead
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { parseTimestamp } from '../../utils/eth-mobile';
import { FONT_SIZE } from '../../utils/styles';

interface Event {
  type: 'BuyTokens' | 'SellTokens';
  buyer?: string;
  seller?: string;
  amountOfETH: bigint;
  amountOfTokens: bigint;
  timestamp: number;
  transactionHash: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { address } = useAccount();
  const { data: vendorContractData } = useDeployedContractInfo('Vendor');

  const { data: buyTokensEvents } = useScaffoldContractRead({
    contractName: 'Vendor',
    functionName: 'BuyTokens',
    args: [address]
  });

  const { data: sellTokensEvents } = useScaffoldContractRead({
    contractName: 'Vendor',
    functionName: 'SellTokens',
    args: [address]
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real implementation, you would refetch events here
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    // This is a mock implementation - in a real app you would fetch actual events
    const mockEvents: Event[] = [
      {
        type: 'BuyTokens',
        buyer: address,
        amountOfETH: 1000000000000000000n, // 1 ETH
        amountOfTokens: 100000000000000000000n, // 100 tokens
        timestamp: Date.now() - 3600000, // 1 hour ago
        transactionHash: '0x1234567890abcdef...'
      },
      {
        type: 'SellTokens',
        seller: address,
        amountOfETH: 500000000000000000n, // 0.5 ETH
        amountOfTokens: 50000000000000000000n, // 50 tokens
        timestamp: Date.now() - 7200000, // 2 hours ago
        transactionHash: '0xabcdef1234567890...'
      }
    ];
    setEvents(mockEvents);
  }, [address]);

  const renderEvent = (event: Event, index: number) => {
    const isBuyEvent = event.type === 'BuyTokens';
    const address = isBuyEvent ? event.buyer : event.seller;

    return (
      <Card key={index} style={styles.eventCard}>
        <Card.Content>
          <View style={styles.eventHeader}>
            <Text variant="titleMedium" style={styles.eventType}>
              {isBuyEvent ? '🟢 Buy Tokens' : '🔴 Sell Tokens'}
            </Text>
            <Text variant="bodySmall" style={styles.timestamp}>
              {parseTimestamp(event.timestamp)}
            </Text>
          </View>

          <View style={styles.eventDetails}>
            <Text variant="bodyMedium" style={styles.detailText}>
              <Text style={styles.label}>Address: </Text>
              <Text style={styles.value}>
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </Text>
            </Text>

            <Text variant="bodyMedium" style={styles.detailText}>
              <Text style={styles.label}>ETH Amount: </Text>
              <Text style={styles.value}>
                {Number(formatEther(event.amountOfETH)).toFixed(4)} ETH
              </Text>
            </Text>

            <Text variant="bodyMedium" style={styles.detailText}>
              <Text style={styles.label}>Token Amount: </Text>
              <Text style={styles.value}>
                {Number(formatEther(event.amountOfTokens)).toFixed(2)} tokens
              </Text>
            </Text>

            <Text variant="bodySmall" style={styles.txHash}>
              TX: {event.transactionHash.slice(0, 10)}...
              {event.transactionHash.slice(-8)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Token Vendor Events
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Recent buy and sell transactions
        </Text>
      </View>

      {events.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No events found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Start trading tokens to see events here
            </Text>
          </Card.Content>
        </Card>
      ) : (
        events.map((event, index) => renderEvent(event, index))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  header: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    ...globalStyles.textMedium,
    marginBottom: 4
  },
  subtitle: {
    color: COLORS.gray,
    ...globalStyles.text
  },
  eventCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    elevation: 2,
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  eventType: {
    fontWeight: 'bold',
    ...globalStyles.textMedium
  },
  timestamp: {
    color: COLORS.gray,
    ...globalStyles.text
  },
  eventDetails: {
    gap: 8
  },
  detailText: {
    ...globalStyles.text
  },
  label: {
    fontWeight: '600',
    color: COLORS.gray
  },
  value: {
    fontWeight: '500',
    color: COLORS.primary
  },
  txHash: {
    color: COLORS.gray,
    marginTop: 8,
    fontFamily: 'monospace'
  },
  emptyCard: {
    marginTop: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderStyle: 'dashed'
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    ...globalStyles.textMedium
  },
  emptySubtext: {
    textAlign: 'center',
    color: COLORS.gray,
    ...globalStyles.text
  }
});
