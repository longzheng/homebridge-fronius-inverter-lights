export type Config = {
  inverterIp: string;
  pollInterval: number;
  pvMaxPower?: number;
  battery?: boolean;
};
