import { useNetwork } from '.';
import { contracts, GenericContract } from '../../utils/eth-mobile';

export function useAllContracts(): {
  [contractName: string]: GenericContract;
} {
  const network = useNetwork();

  const contractsData = contracts?.[network.id];
  return contractsData ? contractsData : {};
}
