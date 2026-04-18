type Matrix = number[][];

export interface TrainingSample {
  input: number[];
  target: number[];
}

export interface NeuralNetworkConfig {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  learningRate?: number;
  seed?: number;
}

export interface PredictionResult {
  probabilities: number[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

class SeededRandom {
  constructor(private seed: number) {}

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

const createMatrix = (rows: number, columns: number, random: SeededRandom) => {
  const matrix: Matrix = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row: number[] = [];

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      row.push((random.next() - 0.5) * 0.6);
    }

    matrix.push(row);
  }

  return matrix;
};

const softmax = (logits: number[]) => {
  const maxLogit = Math.max(...logits);
  const exponents = logits.map((value) => Math.exp(value - maxLogit));
  const denominator = exponents.reduce((sum, value) => sum + value, 0) || 1;
  return exponents.map((value) => value / denominator);
};

export class TinyNeuralNetwork {
  private readonly learningRate: number;
  private readonly inputHidden: Matrix;
  private readonly hiddenBias: number[];
  private readonly hiddenOutput: Matrix;
  private readonly outputBias: number[];

  constructor(private readonly config: NeuralNetworkConfig) {
    const random = new SeededRandom(config.seed ?? 42);
    this.learningRate = config.learningRate ?? 0.03;
    this.inputHidden = createMatrix(config.hiddenSize, config.inputSize, random);
    this.hiddenBias = new Array(config.hiddenSize).fill(0);
    this.hiddenOutput = createMatrix(config.outputSize, config.hiddenSize, random);
    this.outputBias = new Array(config.outputSize).fill(0);
  }

  private forward(input: number[]) {
    const hidden = new Array(this.config.hiddenSize).fill(0);

    for (let hiddenIndex = 0; hiddenIndex < this.config.hiddenSize; hiddenIndex += 1) {
      const row = this.inputHidden[hiddenIndex] as number[];
      let sum = this.hiddenBias[hiddenIndex] ?? 0;

      for (let inputIndex = 0; inputIndex < this.config.inputSize; inputIndex += 1) {
        sum += (row[inputIndex] ?? 0) * (input[inputIndex] ?? 0);
      }

      hidden[hiddenIndex] = Math.tanh(sum);
    }

    const outputRaw = new Array(this.config.outputSize).fill(0);

    for (let outputIndex = 0; outputIndex < this.config.outputSize; outputIndex += 1) {
      const row = this.hiddenOutput[outputIndex] as number[];
      let sum = this.outputBias[outputIndex] ?? 0;

      for (let hiddenIndex = 0; hiddenIndex < this.config.hiddenSize; hiddenIndex += 1) {
        sum += (row[hiddenIndex] ?? 0) * hidden[hiddenIndex];
      }

      outputRaw[outputIndex] = sum;
    }

    return { hidden, probabilities: softmax(outputRaw) };
  }

  train(samples: TrainingSample[], epochs: number) {
    for (let epoch = 0; epoch < epochs; epoch += 1) {
      for (const sample of samples) {
        const { hidden, probabilities } = this.forward(sample.input);
        const outputError = probabilities.map((value, index) => value - (sample.target[index] ?? 0));
        const hiddenError = new Array(this.config.hiddenSize).fill(0);

        for (let hiddenIndex = 0; hiddenIndex < this.config.hiddenSize; hiddenIndex += 1) {
          let sum = 0;

          for (let outputIndex = 0; outputIndex < this.config.outputSize; outputIndex += 1) {
            sum += ((this.hiddenOutput[outputIndex] as number[])[hiddenIndex] ?? 0) * (outputError[outputIndex] ?? 0);
          }

          hiddenError[hiddenIndex] = sum;
        }

        for (let outputIndex = 0; outputIndex < this.config.outputSize; outputIndex += 1) {
          const row = this.hiddenOutput[outputIndex] as number[];

          for (let hiddenIndex = 0; hiddenIndex < this.config.hiddenSize; hiddenIndex += 1) {
            row[hiddenIndex] = (row[hiddenIndex] ?? 0) - this.learningRate * (outputError[outputIndex] ?? 0) * hidden[hiddenIndex];
          }

          this.outputBias[outputIndex] = (this.outputBias[outputIndex] ?? 0) - this.learningRate * (outputError[outputIndex] ?? 0);
        }

        for (let hiddenIndex = 0; hiddenIndex < this.config.hiddenSize; hiddenIndex += 1) {
          const row = this.inputHidden[hiddenIndex] as number[];
          const derivative = 1 - hidden[hiddenIndex] * hidden[hiddenIndex];
          const gradient = hiddenError[hiddenIndex] * derivative;

          for (let inputIndex = 0; inputIndex < this.config.inputSize; inputIndex += 1) {
            row[inputIndex] = (row[inputIndex] ?? 0) - this.learningRate * gradient * (sample.input[inputIndex] ?? 0);
          }

          this.hiddenBias[hiddenIndex] = (this.hiddenBias[hiddenIndex] ?? 0) - this.learningRate * gradient;
        }
      }
    }
  }

  predict(input: number[]): PredictionResult {
    const probabilities = this.forward(input).probabilities.map((value) => clamp(value, 0, 1));
    return { probabilities };
  }
}
