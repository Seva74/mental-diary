import { Analysis, SupportAction } from '../types';
import { supportActions as seedSupportActions } from '../seed';

export interface SupportGateway {
  provider: string;
  findSupportActions(analysis: Analysis): Promise<SupportAction[]>;
}

const chooseLocalSupportActions = (analysis: Analysis): SupportAction[] => {
  if (analysis.riskLevel === 'critical') {
    return [seedSupportActions[0], seedSupportActions[1], seedSupportActions[3]].filter(Boolean) as SupportAction[];
  }

  if (analysis.riskLevel === 'high') {
    return [seedSupportActions[0], seedSupportActions[1], seedSupportActions[2]].filter(Boolean) as SupportAction[];
  }

  if (analysis.riskLevel === 'moderate') {
    return [seedSupportActions[1], seedSupportActions[2], seedSupportActions[3]].filter(Boolean) as SupportAction[];
  }

  return [seedSupportActions[1], seedSupportActions[2]].filter(Boolean) as SupportAction[];
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Support gateway timeout'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
};

const buildRemoteGateway = (apiUrl: string, timeoutMs: number): SupportGateway => ({
  provider: 'remote',
  async findSupportActions(analysis: Analysis): Promise<SupportAction[]> {
    const url = new URL(apiUrl);
    url.searchParams.set('riskLevel', analysis.riskLevel);

    const response = await withTimeout(fetch(url.toString()), timeoutMs);

    if (!response.ok) {
      throw new Error(`Support provider request failed with status ${response.status}`);
    }

    const payload = await response.json() as SupportAction[];
    return Array.isArray(payload) && payload.length > 0 ? payload : chooseLocalSupportActions(analysis);
  }
});

const buildLocalGateway = (): SupportGateway => ({
  provider: 'local-fallback',
  async findSupportActions(analysis: Analysis): Promise<SupportAction[]> {
    return chooseLocalSupportActions(analysis);
  }
});

export const createSupportGateway = (): SupportGateway => {
  const provider = (process.env.SUPPORT_PROVIDER || 'local').toLowerCase();
  const apiUrl = process.env.SUPPORT_API_URL;
  const timeoutMs = Number(process.env.SUPPORT_TIMEOUT_MS || 2500);

  if (provider === 'remote' && apiUrl) {
    const remoteGateway = buildRemoteGateway(apiUrl, Number.isFinite(timeoutMs) ? timeoutMs : 2500);

    return {
      provider: remoteGateway.provider,
      async findSupportActions(analysis: Analysis): Promise<SupportAction[]> {
        try {
          return await remoteGateway.findSupportActions(analysis);
        } catch {
          return chooseLocalSupportActions(analysis);
        }
      }
    };
  }

  return buildLocalGateway();
};