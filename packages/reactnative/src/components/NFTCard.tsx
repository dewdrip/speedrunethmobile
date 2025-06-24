import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import { useScaffoldContractWrite } from '../hooks/eth-mobile';
import globalStyles from '../styles/globalStyles';
import { COLORS } from '../utils/constants';
import { WINDOW_WIDTH } from '../utils/styles';
import { Address, AddressInput } from './eth-mobile';
import { Collectible } from './MyHoldings';

interface NFTCardProps {
  nft: Collectible;
}

export function NFTCard({ nft }: NFTCardProps) {
  const [transferToAddress, setTransferToAddress] = useState('');
  const toast = useToast();
  const { write: transfer } = useScaffoldContractWrite({
    contractName: 'YourCollectible',
    functionName: 'transferFrom'
  });

  const transferNFT = async () => {
    try {
      await transfer({
        args: [nft.owner, transferToAddress, BigInt(nft.id.toString())]
      });
    } catch (error) {
      toast.show('Error transferring NFT', {
        type: 'danger'
      });
      console.error('Error transferring NFT: ', error);
    }
  };

  return (
    <View style={styles.card}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: nft.image }}
          style={styles.image}
          resizeMode="stretch"
        />
        <View style={styles.idBadge}>
          <Text style={styles.idText}># {nft.id}</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        {/* Name and Attributes */}
        <View style={styles.nameSection}>
          <Text style={styles.nameText}>{nft.name}</Text>
          {nft.attributes && nft.attributes.length > 0 && (
            <View style={styles.attributesContainer}>
              {nft.attributes.map((attr, index) => (
                <Chip
                  key={index}
                  mode="flat"
                  style={styles.attributeChip}
                  textStyle={styles.attributeText}
                >
                  {attr.value}
                </Chip>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{nft.description}</Text>
        </View>

        {/* Owner */}
        <View style={styles.ownerSection}>
          <Text style={styles.labelText}>Owner : </Text>
          <Address address={nft.owner} />
        </View>

        {/* Transfer Section */}
        <View style={styles.transferSection}>
          <Text style={styles.labelText}>Transfer To: </Text>
          <AddressInput
            value={transferToAddress}
            placeholder="receiver address"
            onChange={setTransferToAddress}
          />
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={transferNFT}
            style={styles.transferButton}
            labelStyle={styles.buttonLabel}
            disabled={!transferToAddress}
          >
            Send
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: WINDOW_WIDTH * 0.8,
    marginVertical: 8
  },
  imageContainer: {
    position: 'relative'
  },
  image: {
    height: 240,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  idBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12
  },
  idText: {
    color: 'white',
    ...globalStyles.textMedium,
    fontSize: 14
  },
  cardBody: {
    padding: 16,
    gap: 12
  },
  nameSection: {
    alignItems: 'center',
    gap: 8
  },
  nameText: {
    fontSize: 20,
    ...globalStyles.textSemiBold,
    textAlign: 'center',
    margin: 0,
    padding: 0
  },
  attributesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center'
  },
  attributeChip: {
    backgroundColor: COLORS.primary
  },
  attributeText: {
    color: 'white',
    ...globalStyles.textMedium,
    fontSize: 12
  },
  descriptionContainer: {
    alignItems: 'center'
  },
  descriptionText: {
    fontSize: 16,
    ...globalStyles.text,
    textAlign: 'center',
    margin: 0
  },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  labelText: {
    fontSize: 16,
    ...globalStyles.textSemiBold
  },
  transferSection: {
    gap: 8
  },
  actionContainer: {
    alignItems: 'flex-end',
    marginTop: 8
  },
  transferButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 32
  },
  buttonLabel: {
    ...globalStyles.textMedium,
    fontSize: 14,
    letterSpacing: 0.5
  }
});
