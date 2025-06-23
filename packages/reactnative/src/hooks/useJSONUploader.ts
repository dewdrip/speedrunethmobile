import axios from 'axios';
import { useEffect, useState } from 'react';

const pinataEndpoint = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
const PINATA_API_KEY = '7ddc8c56c25211161baf';
const PINATA_API_SECRET =
  '6fed59a71efcee9b9148ff9c9415faf570093b82e2b42b0b0a2f876587f47796';

interface UseJSONUploaderConfig {
  json?: any;
  enabled?: boolean;
  onUpload?: (progress: number) => void;
  onError?: (error: any) => void;
}

interface JSONData {
  ipfsHash: string;
  bufferHash: string;
  size: number;
  timestamp: string;
}

/**
 * @notice uploads json to IPFS via Pinata(https://pinata.cloud)
 * @param config.json - any JSON data
 * @param config.enabled - if true, json is uploaded automatically
 * @param config.onUpload - upload progress handler function
 * @param config.onError - error handler function
 */
export default function useJSONUploader({
  json,
  enabled,
  onUpload,
  onError
}: UseJSONUploaderConfig) {
  const [data, setData] = useState<JSONData>();
  const [isUploading, setIsUploading] = useState(enabled || false);
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState<any>();

  // upload json to ipfs via Pinata
  const upload = async (json: any): Promise<JSONData | undefined> => {
    try {
      setIsUploading(true);

      const body = {
        pinataOptions: {
          cidVersion: 1
        },
        pinataContent: json
      };

      const { data } = await axios.post(pinataEndpoint, body, {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET
        },
        onUploadProgress: ({ loaded, total }) => {
          // track upload progress
          const progress = (loaded * 100) / (total || 1);

          setProgress(progress);

          if (onUpload) {
            onUpload(progress);
          }
        }
      });

      if (error) {
        setError(null);
      }

      const result = {
        ipfsHash: data.IpfsHash,
        bufferHash: '',
        size: data.PinSize,
        timestamp: data.Timestamp
      };

      setData(result);
      return result;
    } catch (error) {
      console.log(error);
      setError(error);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (enabled !== false && json) {
      upload(json);
    }
  }, [enabled, json]);

  return {
    data,
    isUploading,
    progress,
    error,
    upload
  };
}
