import { isAddress, JsonRpcProvider } from 'ethers';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { useModal } from 'react-native-modalfy';
import { Text, TextInput } from 'react-native-paper';
import ethmobileConfig from '../../../../ethmobile.config';
import { Blockie } from '../../../components/eth-mobile';
import globalStyles from '../../../styles/globalStyles';
import { COLORS } from '../../../utils/constants';
import { isENS } from '../../../utils/eth-mobile';
import { FONT_SIZE } from '../../../utils/styles';

type Props = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  outlineStyle?: TextStyle;
  contentStyle?: TextStyle;
  errorStyle?: TextStyle;
  scan?: boolean;
};

export function AddressInput({
  value,
  placeholder,
  onChange,
  onSubmit,
  containerStyle,
  inputStyle,
  outlineStyle,
  contentStyle,
  errorStyle,
  scan
}: Props) {
  const { openModal } = useModal();

  const [error, setError] = useState('');
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const scanQRCode = () => {
    Keyboard.dismiss();
    openModal('QRCodeScanner', {
      onScan: onChange
    });
  };

  const resolveENS = async (ensName: string) => {
    try {
      const provider = new JsonRpcProvider(
        `https://eth-mainnet.alchemyapi.io/v2/${ethmobileConfig.networks.ethereum}`
      );

      const address = await provider.resolveName(ensName);

      if (address && isAddress(address)) {
        onChange(address);
        setLocalValue(address);
      } else {
        setError('Invalid ENS');
      }
    } catch (error) {
      setError('Could not resolve ENS');
    }
  };

  const handleInputChange = (value: string) => {
    setLocalValue(value);
    onChange(value);

    if (error) {
      setError('');
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only try to resolve ENS if the input looks like a complete ENS name
    if (isENS(value) && value.length > 4) {
      // Debounce ENS resolution to avoid resolving while user is still typing
      timeoutRef.current = setTimeout(() => {
        resolveENS(value);
      }, 1000); // Wait 1 second after user stops typing
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={{ ...styles.container, ...containerStyle }}>
      <TextInput
        value={localValue}
        mode="outlined"
        style={{ ...styles.input, ...inputStyle }}
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        textColor="black"
        onChangeText={handleInputChange}
        onSubmitEditing={onSubmit}
        left={
          isAddress(localValue) ? (
            <TextInput.Icon
              icon={() => (
                <Blockie address={localValue} size={1.8 * FONT_SIZE['xl']} />
              )}
            />
          ) : null
        }
        right={
          scan ? (
            <TextInput.Icon icon="qrcode-scan" onPress={scanQRCode} />
          ) : null
        }
        error={!!error}
        outlineStyle={{ ...styles.outline, ...outlineStyle }}
        contentStyle={{ ...styles.content, ...contentStyle }}
      />
      {error && (
        <Text
          variant="bodySmall"
          style={{ ...styles.errorText, ...errorStyle }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  myAccountText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textMedium,
    marginLeft: 8,
    marginBottom: -2
  },
  accountName: {
    color: 'black',
    ...globalStyles.text,
    fontSize: FONT_SIZE['md']
  },
  input: {
    backgroundColor: '#f5f5f5'
  },
  outline: {
    borderRadius: 100,
    borderColor: COLORS.gray
  },
  content: {
    ...globalStyles.text
  },
  errorText: {
    color: 'red',
    marginTop: 4,
    ...globalStyles.text
  }
});
