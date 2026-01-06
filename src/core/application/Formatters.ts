export const formatEmissions = (val: number): string => {
    return val.toLocaleString('en-US', { maximumFractionDigits: 2 }) + " t";
};

export const formatIntensity = (val: number): string => {
    return val.toFixed(2) + " gCO₂e/MJ";
};

export const formatPercentage = (val: number): string => {
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
};