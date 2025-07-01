import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import { Address } from '../../components/eth-mobile';
import { useScaffoldEventHistory } from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { parseBalance } from '../../utils/eth-mobile/helpers';
import { FONT_SIZE } from '../../utils/styles';

export default function Events() {
  // BuyTokens Events
  const {
    data: buyTokenEvents,
    isLoading: isBuyEventsLoading,
    refetch: refetchBuyTokenEvents
  } = useScaffoldEventHistory({
    contractName: 'Vendor',
    eventName: 'BuyTokens',
    fromBlock: 0n,
    watch: true
  });

  // SellTokens Events
  const {
    data: sellTokenEvents,
    isLoading: isSellEventsLoading,
    refetch: refetchSellTokenEvents
  } = useScaffoldEventHistory({
    contractName: 'Vendor',
    eventName: 'SellTokens',
    fromBlock: 0n,
    watch: true
  });

  const renderEventTable = (
    title: string,
    events: any[] | undefined,
    isLoading: boolean
  ) => {
    return (
      <View style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          {title}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <Card style={styles.tableCard}>
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.headerCell}>
                  <Text style={styles.headerText}>
                    {title === 'Buy Token Events' ? 'Buyer' : 'Seller'}
                  </Text>
                </DataTable.Title>
                <DataTable.Title style={styles.headerCell}>
                  <Text style={styles.headerText}>Amount of Tokens</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.headerCell}>
                  <Text style={styles.headerText}>Amount of ETH</Text>
                </DataTable.Title>
              </DataTable.Header>

              {!events || events.length === 0 ? (
                <DataTable.Row>
                  <DataTable.Cell style={styles.emptyCell}>
                    <Text style={styles.emptyText}>No events found</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ) : (
                events.map((event, index) => (
                  <DataTable.Row key={index} style={styles.tableRow}>
                    <DataTable.Cell style={styles.cell}>
                      <Address
                        address={event.args?.[0]}
                        containerStyle={styles.addressContainer}
                      />
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.cell}>
                      <Text style={styles.valueText}>
                        {Number(
                          parseBalance(event.args?.[1] || 0n)
                        ).toLocaleString('en-US')}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.cell}>
                      <Text style={styles.valueText}>
                        {Number(
                          parseBalance(event.args?.[2] || 0n)
                        ).toLocaleString('en-US')}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              )}
            </DataTable>
          </Card>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isBuyEventsLoading || isSellEventsLoading}
          onRefresh={() => {
            refetchBuyTokenEvents();
            refetchSellTokenEvents();
          }}
        />
      }
    >
      {renderEventTable('Buy Token Events', buyTokenEvents, isBuyEventsLoading)}
      {renderEventTable(
        'Sell Token Events',
        sellTokenEvents,
        isSellEventsLoading
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
    marginBottom: 24,
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
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textMedium
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  tableCard: {
    backgroundColor: 'white'
  },
  tableHeader: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 0,
    backgroundColor: COLORS.primaryLight
  },
  headerCell: {
    flex: 1,
    justifyContent: 'center'
  },
  headerText: {
    ...globalStyles.textMedium,
    fontSize: FONT_SIZE.sm
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray
  },
  cell: {
    flex: 1,
    justifyContent: 'center'
  },
  addressContainer: { transform: [{ scale: 0.8 }], marginTop: 5 },
  valueText: {
    ...globalStyles.text,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center'
  },
  emptyCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20
  },
  emptyText: {
    ...globalStyles.text,
    color: COLORS.gray,
    textAlign: 'center'
  }
});
