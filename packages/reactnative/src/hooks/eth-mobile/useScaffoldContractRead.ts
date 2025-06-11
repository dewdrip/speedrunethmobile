import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAccount, useDeployedContractInfo, useNetwork } from '.';
import { Account } from '../../store/reducers/Wallet';

type Props = {
  contractName: string;
  functionName: string;
  args?: any[];
};

/**
 * This automatically loads (by name) the contract ABI and address from
 * the contracts present in deployedContracts.ts & externalContracts.ts corresponding to networks configured in ethmobile.config.ts
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.functionName - name of the function to be called
 * @param config.args - args to be passed to the function call (Optional)
 */
export function useScaffoldContractRead({
  contractName,
  functionName,
  args: _args
}: Props) {
  const args = _args || [];

  const {
    data: deployedContractData,
    isLoading: isLoadingDeployedContractData
  } = useDeployedContractInfo(contractName);
  const network = useNetwork();
  const connectedAccount = useAccount();
  const wallet = useSelector((state: any) => state.wallet);

  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  async function fetchData() {
    if (!deployedContractData) return;

    try {
      setIsLoading(true);
      const provider = new JsonRpcProvider(network.provider);

      const activeAccount = wallet.accounts.find(
        (account: Account) =>
          account.address.toLowerCase() ===
          connectedAccount.address.toLowerCase()
      );

      const activeWallet = new Wallet(activeAccount.privateKey, provider);
      const contract = new Contract(
        deployedContractData.address,
        deployedContractData.abi,
        activeWallet
      );

      const result = await contract[functionName](...args);

      if (error) {
        setError(null);
      }
      setData(result);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [isLoadingDeployedContractData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}
