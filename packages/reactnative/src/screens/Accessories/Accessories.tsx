import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Header from '../../components/Header';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { FONT_SIZE } from '../../utils/styles';
import Belt from './modules/Belt';
import Hat from './modules/Hat';
import Scarf from './modules/Scarf';

const Tab = createMaterialTopTabNavigator();

export default function Accessories() {
  return (
    <View style={styles.container}>
      <Header title="Accessories" />

      <View style={styles.surface}>
        <Text style={styles.boldText}>Get an accessory for your Snowman☃️</Text>
        <Text style={styles.lightText}>
          Mint one for <Text style={{ color: COLORS.primary }}>0.01 ETH</Text>
        </Text>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarIndicatorStyle: {
            backgroundColor: COLORS.primary
          },
          tabBarLabelStyle: {
            textTransform: 'none',
            fontSize: FONT_SIZE['lg'],
            ...globalStyles.text
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#C7C6C7'
        }}
      >
        <Tab.Screen name="Belt 🥋" component={Belt} />
        <Tab.Screen name="Hat 🎩" component={Hat} />
        <Tab.Screen name="Scarf 🧣" component={Scarf} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  surface: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  lightText: {
    ...globalStyles.text,
    fontSize: FONT_SIZE.md,
    marginTop: 5
  },
  boldText: {
    ...globalStyles.textMedium,
    fontSize: FONT_SIZE.xl,
    textAlign: 'center'
  }
});
