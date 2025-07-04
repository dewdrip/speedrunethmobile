import React from 'react';
import { StyleSheet, View } from 'react-native';
import Accessory from './Accessory';

export default function Belt() {
  return (
    <View style={styles.container}>
      <Accessory name="Belt" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  }
});
