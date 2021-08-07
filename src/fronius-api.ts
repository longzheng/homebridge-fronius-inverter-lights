import { Logging } from 'homebridge';
import axios, { AxiosInstance } from 'axios';

export class FroniusApi {
  private readonly http: AxiosInstance;
  private readonly inverterIp: string;
  private readonly log: Logging;
  private request: Promise<any> | undefined; // cache the current request to prevent concurrent requests

  constructor(inverterIp: string, log: Logging) {
    this.inverterIp = inverterIp;
    this.log = log;

    this.http = axios.create({
      timeout: 2000,
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
        .get(url)
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
        .catch((error) => {
          this.log.error(error.message);

          this.request = undefined;
          return resolve(null);
        });
    });

    return this.request;
  };
}
