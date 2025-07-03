import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import PriceActions from './modules/PriceActions';

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      <PriceActions />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 10 }
});
