import { Entry, ModelAssessment } from '../types';
import { MentalStateModel } from '../ml/mentalStateModel';

export interface MlAdapter {
  provider: string;
  mode: 'local-trained' | 'external';
  configured: boolean;
  assess(entries: Entry[]): Promise<ModelAssessment>;
}

const createLocalMlAdapter = (): MlAdapter => {
  const model = new MentalStateModel();

  return {
    provider: 'local-neural-network',
    mode: 'local-trained',
    configured: true,
    async assess(entries: Entry[]) {
      return model.assess(entries);
    }
  };
};

const createPythonMlAdapter = (serviceUrl: string): MlAdapter => {
  const localFallback = new MentalStateModel();

  return {
    provider: 'python-sklearn-service',
    mode: 'external',
    configured: true,
    async assess(entries: Entry[]) {
      try {
        const response = await fetch(new URL('/predict', serviceUrl).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entries
          })
        });

        if (!response.ok) {
          throw new Error(`ML service failed with status ${response.status}`);
        }

        return await response.json() as ModelAssessment;
      } catch {
        return localFallback.assess(entries);
      }
    }
  };
};

export const createMlAdapter = (): MlAdapter => {
  const provider = (process.env.ML_PROVIDER || 'local').toLowerCase();
  const serviceUrl = process.env.ML_SERVICE_URL;

  if (provider === 'python' && serviceUrl) {
    return createPythonMlAdapter(serviceUrl);
  }

  return createLocalMlAdapter();
};
