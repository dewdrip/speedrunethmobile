import { useIsFocused } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useModal } from 'react-native-modalfy';
import { Text } from 'react-native-paper';
//@ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import Header from '../../components/Header';
import { useNetwork } from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { FONT_SIZE } from '../../utils/styles';

export default function Settings() {
  const { openModal } = useModal();
  const isFocused = useIsFocused();

  const network = useNetwork();

  const switchNetwork = () => {
    openModal('SwitchNetworkModal');
  };

  if (!isFocused) return;
  return (
    <View style={styles.container}>
      <Header title="Settings" />

      <ScrollView style={{ flex: 1, backgroundColor: 'white', padding: 15 }}>
        <TouchableOpacity
          onPress={() => openModal('ChangePasswordModal')}
          style={styles.settingWrapper}
        >
          <Ionicons name="lock-closed-outline" size={FONT_SIZE['xl'] * 1.2} />
          <Text style={styles.settingTitle}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={switchNetwork} style={styles.settingWrapper}>
          <Ionicons name="git-network-outline" size={FONT_SIZE['xl'] * 1.2} />
          <Text style={styles.settingTitle}>
            Change Network<Text style={styles.network}>({network.name})</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1
  },
  settingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    paddingVertical: 16
  },
  settingTitle: {
    fontSize: FONT_SIZE['xl'],
    ...globalStyles.text
  },
  network: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text,
    color: COLORS.primary
  }
});
