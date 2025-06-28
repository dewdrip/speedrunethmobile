import { formatEther, parseEther } from 'ethers';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import CustomButton from '../../components/buttons/CustomButton';
import { Address } from '../../components/eth-mobile';
import {
  useAccount,
  useBalance,
  useDeployedContractInfo,
  useNetwork,
  useScaffoldContractRead,
  useScaffoldContractWrite,
  useScaffoldEventHistory
} from '../../hooks/eth-mobile';
import globalStyles from '../../styles/globalStyles';
import { FONT_SIZE } from '../../utils/styles';

// Simple time formatting function
const formatTimeLeft = (seconds: bigint | undefined): string => {
  if (!seconds) return '0';
  const totalSeconds = Number(seconds);
  if (totalSeconds <= 0) return '0';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// ETH Price component
const ETHToPrice = ({
  value,
  style
}: {
  value: string | undefined;
  style?: any;
}) => {
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
};

export default function Home() {
  const { address: connectedAddress } = useAccount();
  const { data: StakerContract } = useDeployedContractInfo('Staker');
  const { data: ExampleExternalContact } = useDeployedContractInfo(
    'ExampleExternalContract'
  );
  const network = useNetwork();

  const { balance: stakerContractBalance } = useBalance({
    address: StakerContract?.address || '',
    watch: true
  });
  const { balance: exampleExternalContractBalance } = useBalance({
    address: ExampleExternalContact?.address || '',
    watch: true
  });

  // Contract Read Actions
  const { data: threshold } = useScaffoldContractRead({
    contractName: 'Staker',
    functionName: 'threshold',
    watch: true
  });
  const { data: timeLeft } = useScaffoldContractRead({
    contractName: 'Staker',
    functionName: 'timeLeft',
    watch: true
  });
  const { data: myStake } = useScaffoldContractRead({
    contractName: 'Staker',
    functionName: 'balances',
    args: [connectedAddress],
    watch: true
  });
  const { data: isStakingCompleted } = useScaffoldContractRead({
    contractName: 'ExampleExternalContract',
    functionName: 'completed',
    watch: true
  });

  // Helper function to safely get the first value from data
  const getFirstValue = (data: any): any => {
    if (Array.isArray(data)) {
      return data[0];
    }
    return data;
  };

  const thresholdValue = getFirstValue(threshold);
  const timeLeftValue = getFirstValue(timeLeft);
  const myStakeValue = getFirstValue(myStake);
  const isCompletedValue = getFirstValue(isStakingCompleted);

  const { write: execute } = useScaffoldContractWrite({
    contractName: 'Staker',
    functionName: 'execute'
  });

  const { write: withdraw } = useScaffoldContractWrite({
    contractName: 'Staker',
    functionName: 'withdraw'
  });

  const { write: stake } = useScaffoldContractWrite({
    contractName: 'Staker',
    functionName: 'stake'
  });

  const handleExecute = async () => {
    try {
      await execute();
    } catch (err) {
      console.error('Error calling execute function: ', err);
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdraw();
    } catch (err) {
      console.error('Error calling withdraw function: ', err);
    }
  };

  const handleStake = async () => {
    try {
      await stake({ value: parseEther('0.5') });
    } catch (err) {
      console.error('Error calling stake function: ', err);
    }
  };

  const { data: stakeEvents, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: 'Staker',
    eventName: 'Stake',
    fromBlock: 0n,
    watch: true
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {isCompletedValue && (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>
            🎉 Staking App triggered `ExampleExternalContract` 🎉
          </Text>
          <View style={styles.successBalanceContainer}>
            <ETHToPrice
              value={
                exampleExternalContractBalance
                  ? formatEther(exampleExternalContractBalance)
                  : undefined
              }
              style={styles.successBalanceText}
            />
            <Text style={styles.successBalanceLabel}>staked !!</Text>
          </View>
        </View>
      )}

      <View
        style={[styles.mainCard, !isCompletedValue && styles.mainCardNoSuccess]}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Staker Contract</Text>
          <Address
            address={StakerContract?.address}
            containerStyle={styles.addressContainer}
            textStyle={styles.addressText}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Time Left</Text>
            <Text style={styles.statValue}>
              {timeLeftValue ? formatTimeLeft(timeLeftValue) : '0'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>You Staked</Text>
            <Text style={styles.statValue}>
              {myStakeValue ? formatEther(myStakeValue) : '0'}{' '}
              {network.currencySymbol}
            </Text>
          </View>
        </View>

        <View style={styles.totalStakedContainer}>
          <Text style={styles.statLabel}>Total Staked</Text>
          <View style={styles.totalStakedValues}>
            <ETHToPrice
              value={
                stakerContractBalance
                  ? formatEther(stakerContractBalance)
                  : undefined
              }
              style={styles.totalStakedText}
            />
            <Text style={styles.totalStakedDivider}>/</Text>
            <ETHToPrice
              value={thresholdValue ? formatEther(thresholdValue) : undefined}
              style={styles.totalStakedText}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <CustomButton
              text="Execute!"
              type="outline"
              onPress={handleExecute}
              style={styles.actionButton}
              labelStyle={styles.buttonLabel}
            />
            <CustomButton
              text="Withdraw"
              type="outline"
              onPress={handleWithdraw}
              style={styles.actionButton}
              labelStyle={styles.buttonLabel}
            />
          </View>
          <CustomButton
            text="🔏 Stake 0.5 ether!"
            type="outline"
            onPress={handleStake}
            style={styles.stakeButton}
            labelStyle={styles.buttonLabel}
          />
        </View>
      </View>

              {/* Stake Events Section */}
              <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Recent Stakes</Text>
          {isLoadingEvents ? (
            <Text style={styles.eventsText}>Loading events...</Text>
          ) : stakeEvents && stakeEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {stakeEvents.slice(0, 5).map((event, index) => (
                <View key={index} style={styles.eventItem}>
                  <Text style={styles.eventUser}>
                    User: {event.args?.[0] ? `${event.args[0].slice(0, 6)}...${event.args[0].slice(-4)}` : 'Unknown'}
                  </Text>
                  <Text style={styles.eventAmount}>
                    Amount: {event.args?.[1] ? formatEther(event.args[1]) : '0'} {network.currencySymbol}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.eventsText}>No stake events found</Text>
          )}
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    gap: 48,
    backgroundColor: 'white'
  },
  successCard: {
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    marginTop: 48,
    alignItems: 'center',
    gap: 8
  },
  successTitle: {
    fontSize: FONT_SIZE['lg'],
    fontWeight: '600',
    textAlign: 'center',
    ...globalStyles.textSemiBold
  },
  successBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  successBalanceText: {
    fontSize: FONT_SIZE['lg'],
    ...globalStyles.text
  },
  successBalanceLabel: {
    fontSize: FONT_SIZE['lg'],
    marginLeft: 4,
    ...globalStyles.text
  },
  mainCard: {
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 32
  },
  mainCardNoSuccess: {
    marginTop: 96
  },
  headerSection: {
    alignItems: 'center',
    width: '100%'
  },
  title: {
    fontSize: FONT_SIZE['xl'] * 1.5,
    marginBottom: 8,
    fontWeight: '600',
    ...globalStyles.textSemiBold
  },
  addressContainer: {
    alignSelf: 'center'
  },
  addressText: {
    fontSize: FONT_SIZE['lg'],
    ...globalStyles.text,
    marginTop: 5
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statLabel: {
    fontSize: FONT_SIZE['lg'],
    marginBottom: 4,
    fontWeight: '600',
    ...globalStyles.textSemiBold
  },
  statValue: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text
  },
  totalStakedContainer: {
    alignItems: 'center',
    width: '100%'
  },
  totalStakedValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  totalStakedText: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text
  },
  totalStakedDivider: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text
  },
  buttonContainer: {
    width: '100%',
    gap: 20
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 28
  },
  actionButton: {
    flex: 1
  },
  stakeButton: {
    width: '100%'
  },
  buttonLabel: {
    ...globalStyles.textSemiBold
  },
  eventsContainer: {
    width: '100%',
    padding: 16,
    gap: 16
  },
  eventsTitle: {
    fontSize: FONT_SIZE['lg'],
    fontWeight: '600',
    ...globalStyles.textSemiBold
  },
  eventsText: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text
  },
  eventsList: {
    width: '100%',
    gap: 16
  },
  eventItem: {
    width: '100%',
    padding: 16,
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 12
  },
  eventUser: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text
  },
  eventAmount: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text
  },
  eventBlock: {
    fontSize: FONT_SIZE['md'],
    ...globalStyles.text
  }
});
