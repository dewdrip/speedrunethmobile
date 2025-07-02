import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function Home() {
  return <ScrollView style={styles.container}></ScrollView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10
  }
});
