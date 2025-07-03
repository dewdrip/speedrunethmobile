import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import CollateralOperations from './modules/CollateralOperations';
import PriceActions from './modules/PriceActions';

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      <PriceActions />
      <CollateralOperations />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 10 }
});
