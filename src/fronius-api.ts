import { Logging } from 'homebridge';
import axios, { AxiosInstance } from 'axios';
import { setupCache } from 'axios-cache-interceptor';

export class FroniusApi {
  private readonly http: AxiosInstance;
  private readonly inverterIp: string;
  private readonly log: Logging;

  constructor(inverterIp: string, log: Logging) {
    this.inverterIp = inverterIp;
    this.log = log;

    const instance = axios.create({
      timeout: 2000,
    });
    
    this.http = setupCache(instance, {
      // force cache API responses for 1 second
      // ignore the HTTP response Cache-Control header
      headerInterpreter: () => 1 * 1000,
    });
  }

  public getPowerFlowRealtimeData = async () => {
    const url = `http://${this.inverterIp}/solar_api/v1/GetPowerFlowRealtimeData.fcgi`;

    return this.http.get<PowerFlowRealtimeData>(url);
  };

  public getInverterInfo = async () => {
    const url = `http://${this.inverterIp}/solar_api/v1/GetInverterInfo.cgi`;

    return this.http.get<InverterInfo>(url);
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