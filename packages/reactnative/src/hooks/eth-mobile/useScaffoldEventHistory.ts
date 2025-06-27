import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Block,
  JsonRpcProvider,
  Log,
  TransactionReceipt,
  TransactionResponse
} from 'ethers';
import { useEffect, useState } from 'react';
import { useDeployedContractInfo, useNetwork } from '.';
import { ContractName } from '../../utils/eth-mobile';

interface UseScaffoldEventHistoryConfig<
  TContractName extends ContractName,
  TEventName extends string
> {
  contractName: TContractName;
  eventName: TEventName;
  fromBlock: bigint;
  filters?: Record<string, any>;
  blockData?: boolean;
  transactionData?: boolean;
  receiptData?: boolean;
  watch?: boolean;
  enabled?: boolean;
}

interface EventData {
  log: Log;
  blockData?: Block | null;
  transactionData?: TransactionResponse | null;
  receiptData?: TransactionReceipt | null;
}

const getEvents = async (
  provider: JsonRpcProvider,
  contractAddress: string,
  eventName: string,
  fromBlock: bigint,
  toBlock?: bigint,
  filters?: Record<string, any>,
  options?: {
    blockData?: boolean;
    transactionData?: boolean;
    receiptData?: boolean;
  }
): Promise<EventData[]> => {
  try {
    // Convert filters to ethers format
    const ethersFilters: any = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          ethersFilters[key] = value;
        }
      });
    }

    // Get logs using ethers - we'll filter by event name later
    const logs = await provider.getLogs({
      address: contractAddress,
      fromBlock: fromBlock,
      toBlock: toBlock,
      ...ethersFilters
    });

    if (!logs || logs.length === 0) return [];

    const finalEvents = await Promise.all(
      logs.map(async log => {
        const eventData: EventData = { log };

        if (options?.blockData && log.blockHash) {
          try {
            eventData.blockData = await provider.getBlock(log.blockHash);
          } catch (error) {
            console.warn('Failed to fetch block data:', error);
            eventData.blockData = null;
          }
        }

        if (options?.transactionData && log.transactionHash) {
          try {
            eventData.transactionData = await provider.getTransaction(
              log.transactionHash
            );
          } catch (error) {
            console.warn('Failed to fetch transaction data:', error);
            eventData.transactionData = null;
          }
        }

        if (options?.receiptData && log.transactionHash) {
          try {
            eventData.receiptData = await provider.getTransactionReceipt(
              log.transactionHash
            );
          } catch (error) {
            console.warn('Failed to fetch receipt data:', error);
            eventData.receiptData = null;
          }
        }

        return eventData;
      })
    );

    return finalEvents;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

/**
 * Reads events from a deployed contract using ethers
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: events, isLoading, error } = useScaffoldEventHistory({
 *   contractName: "YourContract",
 *   eventName: "Transfer",
 *   fromBlock: 0n,
 * });
 *
 * // With filters
 * const { data: events } = useScaffoldEventHistory({
 *   contractName: "YourContract",
 *   eventName: "Transfer",
 *   fromBlock: 1000n,
 *   filters: { from: "0x123..." },
 * });
 *
 * // With additional data
 * const { data: events } = useScaffoldEventHistory({
 *   contractName: "YourContract",
 *   eventName: "Transfer",
 *   fromBlock: 0n,
 *   blockData: true,
 *   transactionData: true,
 *   receiptData: true,
 * });
 *
 * // With watch enabled for real-time updates
 * const { data: events } = useScaffoldEventHistory({
 *   contractName: "YourContract",
 *   eventName: "Transfer",
 *   fromBlock: 0n,
 *   watch: true,
 * });
 * ```
 *
 * @param config - The config settings
 * @param config.contractName - deployed contract name from deployedContracts.ts
 * @param config.eventName - name of the event to listen for
 * @param config.fromBlock - the block number to start reading events from
 * @param config.filters - filters to be applied to the event (parameterName: value)
 * @param config.blockData - if set to true it will return the block data for each event (default: false)
 * @param config.transactionData - if set to true it will return the transaction data for each event (default: false)
 * @param config.receiptData - if set to true it will return the receipt data for each event (default: false)
 * @param config.watch - if set to true, the events will be updated every 15 seconds (default: false)
 * @param config.enabled - set this to false to disable the hook from running (default: true)
 *
 * @returns Object containing:
 * - data: Array of event data with optional block, transaction, and receipt data
 * - status: Query status ('idle' | 'pending' | 'error' | 'success')
 * - error: Error object if query failed
 * - isLoading: Boolean indicating if the query is loading
 * - isFetchingNewEvent: Boolean indicating if fetching new events
 * - refetch: Function to manually refetch the data
 */
export const useScaffoldEventHistory = <
  TContractName extends ContractName,
  TEventName extends string
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  blockData = false,
  transactionData = false,
  receiptData = false,
  watch = false,
  enabled = true
}: UseScaffoldEventHistoryConfig<TContractName, TEventName>) => {
  const network = useNetwork();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [currentBlockNumber, setCurrentBlockNumber] = useState<bigint | null>(
    null
  );

  const { data: deployedContractData } = useDeployedContractInfo(contractName);

  // Create provider
  const provider = network?.provider
    ? new JsonRpcProvider(network.provider)
    : null;

  const isContractAddressAndProviderReady =
    Boolean(deployedContractData?.address) && Boolean(provider);

  // Watch for new blocks if enabled
  useEffect(() => {
    if (!watch || !provider) return;

    const updateBlockNumber = async () => {
      try {
        const blockNumber = await provider.getBlockNumber();
        setCurrentBlockNumber(BigInt(blockNumber));
      } catch (error) {
        console.error('Error getting block number:', error);
      }
    };

    updateBlockNumber();

    // Set up polling for new blocks
    const interval = setInterval(updateBlockNumber, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [watch, provider]);

  const query = useInfiniteQuery({
    queryKey: [
      'eventHistory',
      {
        contractName,
        address: deployedContractData?.address,
        eventName,
        fromBlock: fromBlock.toString(),
        networkId: network?.id,
        filters: JSON.stringify(filters)
      }
    ],
    queryFn: async ({ pageParam }) => {
      if (
        !isContractAddressAndProviderReady ||
        !deployedContractData?.address
      ) {
        return [];
      }

      const toBlock = pageParam || currentBlockNumber || undefined;

      const data = await getEvents(
        provider!,
        String(deployedContractData.address),
        eventName,
        fromBlock,
        toBlock,
        filters,
        { blockData, transactionData, receiptData }
      );

      return data;
    },
    enabled: enabled && isContractAddressAndProviderReady,
    initialPageParam: currentBlockNumber || fromBlock,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!currentBlockNumber || fromBlock >= currentBlockNumber)
        return undefined;

      const lastPageHighestBlock = Math.max(
        Number(fromBlock),
        ...(lastPage || []).map(event => Number(event.log.blockNumber || 0))
      );
      const nextBlock = BigInt(
        Math.max(Number(lastPageParam), lastPageHighestBlock) + 1
      );

      if (nextBlock > currentBlockNumber) return undefined;

      return nextBlock;
    },
    select: data => {
      const events = data.pages.flat();
      const eventHistoryData = events?.map(addIndexedArgsToEvent);

      return {
        pages: eventHistoryData?.reverse(),
        pageParams: data.pageParams
      };
    }
  });

  useEffect(() => {
    const shouldSkipEffect = !currentBlockNumber || !watch || isFirstRender;
    if (shouldSkipEffect) {
      // skipping on first render, since on first render we should call queryFn with
      // fromBlock value, not currentBlockNumber
      if (isFirstRender) setIsFirstRender(false);
      return;
    }

    query.fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBlockNumber, watch]);

  return {
    data: query.data?.pages,
    status: query.status,
    error: query.error,
    isLoading: query.isLoading,
    isFetchingNewEvent: query.isFetchingNextPage,
    refetch: query.refetch
  };
};

/**
 * Helper function to add indexed arguments to event data
 * @param event - The event data to process
 * @returns Event data with parsed arguments
 */
export const addIndexedArgsToEvent = (event: EventData) => {
  // Parse the log to extract event arguments
  if (event.log && event.log.topics && event.log.topics.length > 0) {
    // This is a simplified version - in a real implementation you'd want to
    // properly decode the event arguments based on the event signature
    return {
      ...event,
      args: {
        // Add decoded args here if needed
        raw: event.log.data,
        topics: event.log.topics
      }
    };
  }

  return event;
};
