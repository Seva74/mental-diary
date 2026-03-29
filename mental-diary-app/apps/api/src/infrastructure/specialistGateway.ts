import { Analysis, Specialist } from '../types';
import { specialists as seedSpecialists } from '../seed';

export interface SpecialistGateway {
  provider: string;
  findSpecialists(analysis: Analysis): Promise<Specialist[]>;
}

const chooseLocalSpecialists = (analysis: Analysis): Specialist[] => {
  if (analysis.riskLevel === 'low') {
    return seedSpecialists.slice(2, 3);
  }

  if (analysis.riskLevel === 'moderate') {
    return seedSpecialists.slice(1, 3);
  }

  return seedSpecialists;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Specialist gateway timeout'));
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

const buildRemoteGateway = (apiUrl: string, timeoutMs: number): SpecialistGateway => ({
  provider: 'remote',
  async findSpecialists(analysis: Analysis): Promise<Specialist[]> {
    const url = new URL(apiUrl);
    url.searchParams.set('riskLevel', analysis.riskLevel);

    const response = await withTimeout(fetch(url.toString()), timeoutMs);

    if (!response.ok) {
      throw new Error(`Specialist provider request failed with status ${response.status}`);
    }

    const payload = await response.json() as Specialist[];
    return Array.isArray(payload) && payload.length > 0 ? payload : chooseLocalSpecialists(analysis);
  }
});

const buildLocalGateway = (): SpecialistGateway => ({
  provider: 'local-fallback',
  async findSpecialists(analysis: Analysis): Promise<Specialist[]> {
    return chooseLocalSpecialists(analysis);
  }
});

export const createSpecialistGateway = (): SpecialistGateway => {
  const provider = (process.env.SPECIALIST_PROVIDER || 'local').toLowerCase();
  const apiUrl = process.env.SPECIALIST_API_URL;
  const timeoutMs = Number(process.env.SPECIALIST_TIMEOUT_MS || 2500);

  if (provider === 'remote' && apiUrl) {
    const remoteGateway = buildRemoteGateway(apiUrl, Number.isFinite(timeoutMs) ? timeoutMs : 2500);

    return {
      provider: remoteGateway.provider,
      async findSpecialists(analysis: Analysis): Promise<Specialist[]> {
        try {
          return await remoteGateway.findSpecialists(analysis);
        } catch {
          return chooseLocalSpecialists(analysis);
        }
      }
    };
  }

  return buildLocalGateway();
};
