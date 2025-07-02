import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import Video, { VideoRef } from 'react-native-video';
import {
  Address as AddressType,
  createTestClient,
  formatEther,
  http,
  parseEther
} from 'viem';
import { hardhat } from 'viem/chains';
import { Address } from '../../components/eth-mobile';
import {
  useBalance,
  useDeployedContractInfo,
  useNetwork,
  useScaffoldContractRead,
  useScaffoldContractWrite,
  useScaffoldEventHistory
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { COLORS } from '../../utils/constants';
import { FONT_SIZE } from '../../utils/styles';
import { Roll, RollEvents, Winner, WinnerEvents } from './modules';

const ROLL_ETH_VALUE = '0.002';
const MAX_TABLE_ROWS = 10;

const ROLL_VIDEOS: Record<string, any> = {
  '0': require('../../assets/rolls/0.webm'),
  '1': require('../../assets/rolls/1.webm'),
  '2': require('../../assets/rolls/2.webm'),
  '3': require('../../assets/rolls/3.webm'),
  '4': require('../../assets/rolls/4.webm'),
  '5': require('../../assets/rolls/5.webm'),
  '6': require('../../assets/rolls/6.webm'),
  '7': require('../../assets/rolls/7.webm'),
  '8': require('../../assets/rolls/8.webm'),
  '9': require('../../assets/rolls/9.webm'),
  SPIN: require('../../assets/rolls/Spin.webm')
};

// Simple Amount display component
const Amount = ({ amount, className }: { amount: number; className?: any }) => {
  return (
    <Text style={[styles.amountText, className]}>{amount.toFixed(4)} ETH</Text>
  );
};

export default function Home() {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);

  const { id: chainId } = useNetwork();

  const testClient = useMemo(
    () =>
      chainId === hardhat.id
        ? createTestClient({
            chain: hardhat,
            mode: 'hardhat',
            transport: http()
          })
        : undefined,
    [chainId]
  );

  const videoRef = useRef<VideoRef>(null);

  const [rolled, setRolled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const toast = useToast();

  const { data: riggedRollContract } = useDeployedContractInfo('RiggedRoll');
  const { balance: riggedRollBalance } = useBalance({
    address: riggedRollContract?.address as string,
    watch: true
  });
  const { data: prize } = useScaffoldContractRead({
    contractName: 'DiceGame',
    functionName: 'prize'
  });

  const { data: rollsHistoryData, isLoading: rollsHistoryLoading } =
    useScaffoldEventHistory({
      contractName: 'DiceGame',
      eventName: 'Roll',
      fromBlock: 0n,
      watch: true
    });

  useEffect(() => {
    if (
      !rollsHistoryLoading &&
      Boolean(rollsHistoryData?.length) &&
      (rollsHistoryData?.length as number) > rolls.length
    ) {
      setIsRolling(false);

      setRolls(
        rollsHistoryData
          ?.map(({ args }) => ({
            address: args?.[0] as AddressType,
            amount: Number(args?.[1]),
            roll: (args?.[2] as bigint).toString(16).toUpperCase()
          }))
          .reverse() || []
      );
    }
  }, [rolls, rollsHistoryData, rollsHistoryLoading]);

  const { data: winnerHistoryData, isLoading: winnerHistoryLoading } =
    useScaffoldEventHistory({
      contractName: 'DiceGame',
      eventName: 'Winner',
      fromBlock: 0n,
      watch: true
    });

  useEffect(() => {
    if (
      !winnerHistoryLoading &&
      Boolean(winnerHistoryData?.length) &&
      (winnerHistoryData?.length as number) > winners.length
    ) {
      setIsRolling(false);

      setWinners(
        winnerHistoryData
          ?.map(({ args }) => ({
            address: args?.[0] as AddressType,
            amount: args?.[1] as bigint
          }))
          .reverse() || []
      );
    }
  }, [winnerHistoryData, winnerHistoryLoading, winners.length]);

  const { write: writeDiceGameAsync } = useScaffoldContractWrite({
    contractName: 'DiceGame',
    functionName: 'rollTheDice'
  });

  const { write: writeRiggedRollAsync } = useScaffoldContractWrite({
    contractName: 'RiggedRoll',
    functionName: 'riggedRoll'
  });

  useEffect(() => {
    if (videoRef.current && !isRolling) {
      // show last frame
      videoRef.current.seek(9999);
    }
  }, [isRolling]);

  const handleRollDice = async () => {
    if (!rolled) {
      setRolled(true);
    }
    setIsRolling(true);
    try {
      await writeDiceGameAsync({
        value: parseEther(ROLL_ETH_VALUE)
      });
      toast.show('Rolling the dice!', { type: 'success' });
    } catch (err) {
      console.error('Error calling rollTheDice function', err);
      setRolled(false);
      toast.show('Failed to roll dice', { type: 'danger' });
    } finally {
      setIsRolling(false);
    }
  };

  const handleRiggedRoll = async () => {
    if (!rolled) {
      setRolled(true);
    }
    setIsRolling(true);
    try {
      await writeRiggedRollAsync();
      toast.show('Rigged roll initiated!', { type: 'success' });
    } catch (err) {
      console.error('Error calling riggedRoll function', err);
      setRolled(false);
      toast.show('Failed to rigged roll', { type: 'danger' });
    } finally {
      setIsRolling(false);
    }
  };

  useEffect(() => {
    console.log('rolled: ', rolled);
    console.log('rolls: ', rolls);
  }, [rolled, rolls]);

  const DiceRolled = useMemo(() => {
    return rolls[0]?.roll || '0';
  }, [rolls]);

  return (
    <ScrollView style={styles.container}>
      {/* Center Column - Game Controls */}
      <View style={styles.centerColumn}>
        <View style={styles.gameContainer}>
          <Text style={styles.gameTitle}>
            Roll a 0, 1, 2, 3, 4 or 5 to win the prize!
          </Text>

          <View style={styles.prizeContainer}>
            <Text style={styles.prizeLabel}>Prize:</Text>
            <Amount
              amount={
                prize ? Number(formatEther(prize as unknown as bigint)) : 0
              }
              className={styles.prizeAmount}
            />
          </View>

          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={handleRollDice}
            disabled={isRolling}
            loading={isRolling}
          >
            Roll the dice!
          </Button>

          <Divider style={styles.divider} />

          <Text style={styles.riggedTitle}>Rigged Roll</Text>

          <View style={styles.riggedInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Address address={riggedRollContract?.address || ''} />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Balance:</Text>
              <Amount
                amount={
                  riggedRollBalance ? Number(formatEther(riggedRollBalance)) : 0
                }
                className={styles.balanceAmount}
              />
            </View>
          </View>

          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={handleRiggedRoll}
            disabled={isRolling}
            loading={isRolling}
          >
            Rigged Roll!
          </Button>

          <View style={styles.videoContainer}>
            {rolled ? (
              isRolling ? (
                <Video
                  key="rolling"
                  source={ROLL_VIDEOS['SPIN']}
                  style={styles.video}
                  resizeMode="contain"
                  repeat
                  playInBackground={false}
                  playWhenInactive={false}
                  controls={false}
                />
              ) : (
                <Video
                  key="rolled"
                  source={ROLL_VIDEOS[rolls[0]?.roll || '0']}
                  style={styles.video}
                  resizeMode="contain"
                  repeat
                  playInBackground={false}
                  playWhenInactive={false}
                  controls={false}
                />
              )
            ) : (
              <Video
                ref={videoRef}
                key="last"
                source={ROLL_VIDEOS[rolls[0]?.roll || '0']}
                style={styles.video}
                resizeMode="contain"
                playInBackground={false}
                playWhenInactive={false}
                controls={false}
              />
            )}
          </View>
        </View>
      </View>

      <RollEvents rolls={rolls.slice(0, MAX_TABLE_ROWS)} />

      <WinnerEvents winners={winners.slice(0, MAX_TABLE_ROWS)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 20
  },
  centerColumn: {
    flex: 2
  },
  gameContainer: {
    alignItems: 'center',
    paddingTop: 16
  },
  gameTitle: {
    fontSize: FONT_SIZE.xl,
    textAlign: 'center',
    marginBottom: 16,
    ...globalStyles.textMedium
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  prizeLabel: {
    fontSize: FONT_SIZE.lg,
    marginRight: 8,
    ...globalStyles.text
  },
  prizeAmount: {
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textMedium,
    color: COLORS.primary
  },
  button: {
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 16,
    paddingHorizontal: 24
  },
  buttonLabel: {
    ...globalStyles.textMedium
  },
  divider: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    width: '100%'
  },
  riggedTitle: {
    fontSize: FONT_SIZE.xl * 1.2,
    textAlign: 'center',
    marginBottom: 16,
    ...globalStyles.textMedium
  },
  riggedInfo: {
    marginBottom: 16,
    width: '100%'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  infoLabel: {
    fontSize: FONT_SIZE.lg,
    marginRight: 8,
    ...globalStyles.text
  },
  balanceAmount: {
    fontSize: FONT_SIZE.lg,
    ...globalStyles.textMedium
  },
  videoContainer: {
    marginTop: 32,
    alignItems: 'center'
  },
  video: {
    width: 300,
    height: 300
  },
  amountText: {
    ...globalStyles.textMedium
  }
});
