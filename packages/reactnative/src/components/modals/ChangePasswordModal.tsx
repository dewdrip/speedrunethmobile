import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
//@ts-ignore
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { Encryptor, LEGACY_DERIVATION_OPTIONS } from '../../core/Encryptor';
import { useSecureStorage } from '../../hooks/eth-mobile';
import { setPassword as setWalletPassword } from '../../store/reducers/Wallet';
import globalStyles from '../../styles/globalStyles';
import { FONT_SIZE, WINDOW_WIDTH } from '../../utils/styles';
import Button from '../buttons/CustomButton';
import PasswordInput from '../forms/PasswordInput';

type Props = {
  modal: {
    closeModal: () => void;
  };
};

export default function ChangePasswordModal({ modal: { closeModal } }: Props) {
  const toast = useToast();
  const { saveItem } = useSecureStorage();
  const wallet = useSelector((state: any) => state.wallet);
  const dispatch = useDispatch();

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const change = async () => {
    try {
      const existingPassword = wallet.password;
      const currentPassword = password.current.trim();
      const newPassword = password.new.trim();
      const confirmPassword = password.confirm.trim();

      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.show('Password cannot be empty!', { type: 'warning' });
        return;
      }

      if (newPassword.length < 8) {
        toast.show('Password must be at least 8 characters', {
          type: 'warning'
        });
        return;
      }

      if (currentPassword !== existingPassword) {
        toast.show('Incorrect password!', { type: 'warning' });
        return;
      }

      if (currentPassword === newPassword) {
        toast.show('Cannot use current password', { type: 'warning' });
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.show('Passwords do not match!', { type: 'warning' });
        return;
      }

      // @ts-ignore
      dispatch(setWalletPassword(newPassword));

      const encryptor = new Encryptor({
        keyDerivationOptions: LEGACY_DERIVATION_OPTIONS
      });

      const encryptedMnemonic = await encryptor.encrypt(
        newPassword,
        wallet.mnemonic
      );

      await saveItem('seedPhrase', encryptedMnemonic);

      const encryptedAccounts = await encryptor.encrypt(
        newPassword,
        wallet.accounts
      );

      await saveItem('accounts', encryptedAccounts);

      closeModal();
      toast.show('Password Changed Successfully', { type: 'success' });
    } catch (error) {
      toast.show('Failed to change password', { type: 'danger' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={globalStyles.text}>
          Change Password
        </Text>

        <Ionicons
          name="close-outline"
          size={FONT_SIZE['xl'] * 1.7}
          onPress={closeModal}
        />
      </View>

      <View style={styles.content}>
        <PasswordInput
          label="Current Password"
          value={password.current}
          infoText={
            password.current.length < 8 && 'Must be at least 8 characters'
          }
          onChange={value => setPassword(prev => ({ ...prev, current: value }))}
          onSubmit={change}
          labelStyle={styles.label}
        />
        <PasswordInput
          label="New Password"
          value={password.new}
          infoText={password.new.length < 8 && 'Must be at least 8 characters'}
          onChange={value => setPassword(prev => ({ ...prev, new: value }))}
          onSubmit={change}
          labelStyle={styles.label}
        />
        <PasswordInput
          label="Confirm Password"
          value={password.confirm}
          infoText={
            password.confirm.length < 8 && 'Must be at least 8 characters'
          }
          onChange={value => setPassword(prev => ({ ...prev, confirm: value }))}
          onSubmit={change}
          labelStyle={styles.label}
        />

        <Button text="Change Password" onPress={change} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 20,
    width: WINDOW_WIDTH * 0.9
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  content: {
    gap: 16
  },
  label: { fontSize: FONT_SIZE.lg, ...globalStyles.text },
  button: {
    marginTop: 10
  }
});
