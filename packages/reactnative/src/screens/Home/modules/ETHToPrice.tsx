import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useNetwork } from '../../../hooks/eth-mobile';
import globalStyles from '../../../styles/globalStyles';

export default function ETHToPrice({
  value,
  style
}: {
  value: string | undefined;
  style?: TextStyle;
}) {
  const network = useNetwork();

  if (!value) {
    return (
      <Text style={[globalStyles.text, style]}>
        {value || '0'} {network.currencySymbol}
      </Text>
    );
  }

  return (
    <Text style={[globalStyles.text, style]}>
      {value} {network.currencySymbol}
    </Text>
  );
}
