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
      return await this.http.get(
        'http://' +
          this.inverterIp +
          '/solar_api/v1/GetPowerFlowRealtimeData.fcgi',
      );
    } catch (error) {
      this.log.error(error);
      return null;
    }
  };
}
