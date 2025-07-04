import { formatEther } from 'ethers';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import {
  useAccount,
  useScaffoldEventHistory,
  useScaffoldReadContract
} from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { FONT_SIZE } from '../../../utils/styles';
import UserPosition from './UserPosition';

const UserPositionsTable = () => {
  const { address: connectedAddress } = useAccount();
  const [users, setUsers] = useState<string[]>([]);

  const { data: events, isLoading } = useScaffoldEventHistory({
    contractName: 'Lending',
    eventName: 'CollateralAdded',
    fromBlock: 0n,
    watch: true,
    blockData: false,
    transactionData: false,
    receiptData: false
  });

  const { data: ethPrice } = useScaffoldReadContract({
    contractName: 'CornDEX',
    functionName: 'currentPrice'
  });

  useEffect(() => {
    if (!events) return;
    setUsers(prevUsers => {
      const uniqueUsers = new Set([...prevUsers]);
      events
        .map(event => {
          return event?.args?.[0]; // First argument is the user address
        })
        .filter((user): user is string => !!user)
        .forEach(user => uniqueUsers.add(user));
      return uniqueUsers.size > prevUsers.length
        ? Array.from(uniqueUsers)
        : prevUsers;
    });
  }, [events, users]);

  const renderSkeletonRow = () => (
    <DataTable.Row style={styles.tableRow}>
      <DataTable.Cell style={styles.cell}>
        <View style={styles.skeleton} />
      </DataTable.Cell>
      <DataTable.Cell style={styles.cell}>
        <View style={styles.skeleton} />
      </DataTable.Cell>
      <DataTable.Cell style={styles.cell}>
        <View style={styles.skeleton} />
      </DataTable.Cell>
      <DataTable.Cell style={styles.cell}>
        <View style={styles.skeleton} />
      </DataTable.Cell>
      <DataTable.Cell style={styles.cell}>
        <View style={styles.skeleton} />
      </DataTable.Cell>
    </DataTable.Row>
  );

  const renderEmptyState = () => (
    <DataTable.Row style={styles.tableRow}>
      <DataTable.Cell style={styles.emptyCell}>
        <Text style={styles.emptyText}>No user positions available.</Text>
      </DataTable.Cell>
    </DataTable.Row>
  );

  return (
    <Card style={styles.tableCard}>
      <DataTable>
        <DataTable.Header style={styles.tableHeader}>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>Address</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>Collateral</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>Debt</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>Ratio</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>{''}</Text>
          </DataTable.Title>
        </DataTable.Header>

        {isLoading || events === undefined
          ? renderSkeletonRow()
          : users.length === 0
            ? renderEmptyState()
            : users.map(user => (
                <UserPosition
                  key={user}
                  user={user}
                  connectedAddress={connectedAddress || ''}
                  ethPrice={Number(formatEther(ethPrice || 0n))}
                />
              ))}
      </DataTable>
    </Card>
  );
};

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 50
  },
  tableHeader: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 0,
    backgroundColor: COLORS.primaryLight
  },
  headerCell: {
    justifyContent: 'center',
    paddingVertical: 12
  },
  headerText: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.textSemiBold,
    textAlign: 'center'
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  cell: {
    justifyContent: 'center',
    paddingVertical: 8
  },
  emptyCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    ...globalStyles.textMedium,
    color: 'gray',
    textAlign: 'center'
  },
  skeleton: {
    width: 60,
    height: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4
  },
  cellText: {
    fontSize: FONT_SIZE.sm,
    ...globalStyles.text,
    textAlign: 'center'
  }
});

export default UserPositionsTable;
