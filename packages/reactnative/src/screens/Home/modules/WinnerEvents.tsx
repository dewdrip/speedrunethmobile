import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import { Address as AddressType, formatEther } from 'viem';
import { Address } from '../../../components/eth-mobile';
import { useNetwork } from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE } from '../../../utils/styles';

export type Winner = {
  address: AddressType;
  amount: bigint;
};

export type WinnerEventsProps = {
  winners: Winner[];
};

export function WinnerEvents({ winners }: WinnerEventsProps) {
  const network = useNetwork();
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.containerTitle}>
        Winner Events
      </Text>

      <Card style={styles.tableCard}>
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={styles.headerCell}>
              <Text style={styles.headerText}>Address</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.headerCell}>
              <Text style={styles.headerText}>Won</Text>
            </DataTable.Title>
          </DataTable.Header>

          {winners.map(({ address, amount }, index) => (
            <DataTable.Row key={index} style={styles.tableRow}>
              <DataTable.Cell style={styles.cell}>
                <Address
                  address={address}
                  containerStyle={styles.addressContainer}
                />
              </DataTable.Cell>
              <DataTable.Cell style={styles.cell}>
                <Text style={styles.valueText}>
                  {formatEther(amount)} {network.currencySymbol}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  containerTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textMedium
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
  }
});
