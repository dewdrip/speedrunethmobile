import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import BorrowOperations from './modules/BorrowOperations';
import CollateralOperations from './modules/CollateralOperations';
import PriceActions from './modules/PriceActions';
import TokenActions from './modules/TokenActions';

export default function Home() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PriceActions />
      <CollateralOperations />
      <BorrowOperations />
      <TokenActions />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 15
  },
  content: {
    gap: 8
  }
});
