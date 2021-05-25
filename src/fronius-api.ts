import { Logging } from 'homebridge';
import axios, { AxiosInstance } from 'axios';

export class FroniusApi {
  private readonly http: AxiosInstance;
  private readonly inverterIp: string;
  private readonly log: Logging;

  constructor(inverterIp: string, log: Logging) {
    this.inverterIp = inverterIp;
    this.log = log;

    this.http = axios.create({
      timeout: 2000,
    });
  }

  public getInverterData = async () => {
    try {
      return await this.http.get<FroniusRealtimeData>(
        'http://' +
          this.inverterIp +
          '/solar_api/v1/GetPowerFlowRealtimeData.fcgi',
      );
    } catch (error) {
      if (error instanceof Error) {
        this.log.error(error.message);
      }
      return null;
    }
  };
}

export interface FroniusRealtimeData {
  Body: Body;
  Head: Head;
}
export interface Body {
  Data: Data;
}
export interface Data {
  Inverters: Record<string, Inverter>;
  Site: Site;
  Version: string;
}
export interface Inverter {
  DT: number;
  E_Day: number;
  E_Total: number;
  E_Year: number;
  P: number;
}
export interface Site {
  E_Day: number;
  E_Total: number;
  E_Year: number;
  Meter_Location: string;
  Mode: string;
  P_Akku: number | null;
  P_Grid: number;
  P_Load: number;
  P_PV: number | null;
  rel_Autonomy: number;
  rel_SelfConsumption: number | null;
}
export interface Head {
  RequestArguments: Record<string, unknown>;
  Status: Status;
  Timestamp: string;
}
export interface Status {
  Code: number;
  Reason: string;
  UserMessage: string;
}
