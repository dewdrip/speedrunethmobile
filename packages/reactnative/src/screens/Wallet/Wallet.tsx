import { useIsFocused } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Footer from './modules/Footer';
import Header from './modules/Header';
import MainBalance from './modules/MainBalance';

type Props = {};

export default function Wallet({}: Props) {
  const isFocused = useIsFocused();

  if (!isFocused) return;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header />
      <MainBalance />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4
  }
});
