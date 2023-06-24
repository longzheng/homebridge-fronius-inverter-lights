import { Logging } from 'homebridge';
import axios, { AxiosInstance } from 'axios';
import { setupCache } from 'axios-cache-adapter';

export class FroniusApi {
  private readonly http: AxiosInstance;
  private readonly inverterIp: string;
  private readonly log: Logging;
  private request: Promise<Site | null> | undefined; // cache the current request to prevent concurrent requests

  constructor(inverterIp: string, log: Logging) {
    this.inverterIp = inverterIp;
    this.log = log;

    // cache API responses for 1 second
    const cache = setupCache({
      maxAge: 1 * 1000,
    });

    this.http = axios.create({
      timeout: 2000,
      adapter: cache.adapter,
    });
  }

  public getInverterData = async () => {
    // if request is already in operation, return the previous request
    if (this.request) {
      return this.request;
    }

    this.request = new Promise((resolve) => {
      const url = `http://${this.inverterIp}/solar_api/v1/GetPowerFlowRealtimeData.fcgi`;

      this.log.debug(`Getting inverter data: ${url}`);

      this.http
        .get<FroniusRealtimeData>(url)
        .then((response) => {
          // clear existing request
          this.request = undefined;

          if (response.status === 200) {
            return resolve(response.data.Body.Data.Site);
          } else {
            this.log.error(`Received invalid status code: ${response.status}`);

            return resolve(null);
          }
        })
        .catch((error: Error) => {
          this.log.error(error.message);

          this.request = undefined;
          return resolve(null);
        });
    });

    return this.request;
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
  SOC?: number; // percentage load of Battery/Akku
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
