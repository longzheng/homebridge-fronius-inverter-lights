import { Logging } from 'homebridge';
import axios, { AxiosInstance } from 'axios';
import { setupCache } from 'axios-cache-adapter';

export class FroniusApi {
  private readonly http: AxiosInstance;
  private readonly inverterIp: string;
  private readonly log: Logging;
  private requestQueue = new Map<string, Promise<unknown>>();

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

  private requestWithDedup = async <T>(url: string): Promise<T | null> => {
    const existingRequest = this.requestQueue.get(url) as Promise<T | null>;

    // if request is already in operation, return the previous request
    if (existingRequest) {
      return existingRequest;
    }

    const request = new Promise<T | null>((resolve) => {
      this.log.debug(`Making request: ${url}`);

      this.http
        .get<T>(url)
        .then((response) => {
          if (response.status !== 200) {
            this.log.error(
              `${url}: received invalid status code: ${response.status}`,
            );

            return resolve(null);
          }

          return resolve(response.data);
        })
        .catch((error: Error) => {
          this.log.error(error.message);

          return resolve(null);
        })
        .finally(() => {
          this.requestQueue.delete(url);
        });
    });

    this.requestQueue.set(url, request);

    return request;
  };

  public getPowerFlowRealtimeData = async () => {
    const url = `http://${this.inverterIp}/solar_api/v1/GetPowerFlowRealtimeData.fcgi`;

    return this.requestWithDedup<PowerFlowRealtimeData>(url);
  };

  public getInverterInfo = async () => {
    const url = `http://${this.inverterIp}/solar_api/v1/GetInverterInfo.cgi`;

    return this.requestWithDedup<InverterInfo>(url);
  };

  public getDeviceDbData = async () => {
    const url = `http://${this.inverterIp}/solar_api/v1/data/DeviceDB_Data.json`;

    return this.requestWithDedup<DeviceDBData>(url);
  };
}
type PowerFlowRealtimeData = {
  Body: {
    Data: {
      Inverters: Record<
        string,
        {
          DT: number;
          E_Day: number;
          E_Total: number;
          E_Year: number;
          P: number;
          SOC?: number;
        }
      >;
      Site: {
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
      };
      Version: string;
    };
  };
  Head: ResponseHead;
};

type InverterInfo = {
  Body: {
    Data: Record<
      string,
      {
        CustomName: string;
        DT: number;
        ErrorCode: number;
        PVPower: number;
        Show: number;
        StatusCode: number;
        UniqueID: string;
      }
    >;
  };
  Head: ResponseHead;
};

type ResponseHead = {
  RequestArguments: Record<string, unknown>;
  Status: {
    Code: number;
    Reason: string;
    UserMessage: string;
  };
  Timestamp: string;
};

type DeviceDBData = {
  Inverters: Record<
    string,
    {
      ProductName: string;
      DeviceFamily: string;
      NominalPower: string;
      PhaseCountAC: string;
    }
  >;
};
