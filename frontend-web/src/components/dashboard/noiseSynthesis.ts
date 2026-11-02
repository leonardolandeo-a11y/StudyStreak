export type NoiseColor = "white" | "pink" | "brown";

/**
 * Generate uncompressed noise in memory without audio downloads.
 * White: flat spectrum. Pink: roughly 1/f. Brown: roughly 1/f².
 * Amplitudes stay conservative to prevent loud output transients.
 */
export function makeNoise(
    color: NoiseColor, samples: number, random: () => number = Math.random
): Float32Array {
    const length = Math.max(0, Math.min(1_000_000, Math.floor(samples)));
    const output = new Float32Array(length);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let brown = 0;
    for (let i = 0; i < length; i++) {
        const white = 2 * random() - 1;
        if (color === "white") {
            output[i] = white * 0.28;
        } else if (color === "pink") {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = Math.max(-1, Math.min(1,
                (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.095));
            b6 = white * 0.115926;
        } else {
            brown = (brown + white * 0.022) / 1.022;
            output[i] = Math.max(-1, Math.min(1, brown * 3.5));
        }
    }

    // Smooth transition at the buffer wrap point, rather than clicking at every loop.
    const blend = Math.min(Math.floor(length / 3), 4096);
    for (let i = 0; i < blend; i++) {
        const fraction = (i + 1) / blend;
        output[length - blend + i] =
            output[length - blend + i] * (1 - fraction) + output[i] * fraction;
    }
    return output;
}
