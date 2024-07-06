import {
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  PlatformConfig,
  StaticPlatformPlugin,
} from 'homebridge';
import { Config } from './config';
import { FroniusAccessory } from './fronius-accessory';
import { FroniusApi } from './fronius-api';

const PLATFORM_NAME = 'FroniusInverterLightsPlatform';
let hap: HAP;

export = (api: API) => {
  hap = api.hap;

  api.registerPlatform(PLATFORM_NAME, FroniusInverterLightsStaticPlatform);
};

class FroniusInverterLightsStaticPlatform implements StaticPlatformPlugin {
  private readonly log: Logging;
  private readonly froniusApi: FroniusApi;
  private readonly pollInterval: number;
  private readonly pvMaxPower?: number;
  private readonly battery?: boolean;

  constructor(log: Logging, config: PlatformConfig) {
    this.log = log;

    const pluginConfig = config as unknown as Config;

    // probably parse config or something here
    this.froniusApi = new FroniusApi(pluginConfig.inverterIp, this.log);
    this.pollInterval = pluginConfig.pollInterval || 10;
    this.pvMaxPower = pluginConfig.pvMaxPower;
    this.battery = pluginConfig.battery;
  }

  /*
   * This method is called to retrieve all accessories exposed by the platform.
   * The Platform can delay the response my invoking the callback at a later time,
   * it will delay the bridge startup though, so keep it to a minimum.
   * The set of exposed accessories CANNOT change over the lifetime of the plugin!
   */
  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    (async () => {
      const deviceMetdata = await this.getDeviceMetadata();

      const accessories = [
        new FroniusAccessory({
          hap,
          log: this.log,
          metering: 'Import',
          froniusApi: this.froniusApi,
          pollInterval: this.pollInterval,
          model: deviceMetdata?.model,
          serialNumber: deviceMetdata?.serialNumber,
        }),
        new FroniusAccessory({
          hap,
          log: this.log,
          metering: 'Export',
          froniusApi: this.froniusApi,
          pollInterval: this.pollInterval,
          model: deviceMetdata?.model,
          serialNumber: deviceMetdata?.serialNumber,
        }),
        new FroniusAccessory({
          hap,
          log: this.log,
          metering: 'Load',
          froniusApi: this.froniusApi,
          pollInterval: this.pollInterval,
          model: deviceMetdata?.model,
          serialNumber: deviceMetdata?.serialNumber,
        }),
        new FroniusAccessory({
          hap,
          log: this.log,
          metering: 'PV',
          froniusApi: this.froniusApi,
          pollInterval: this.pollInterval,
          pvMaxPower: this.pvMaxPower,
          model: deviceMetdata?.model,
          serialNumber: deviceMetdata?.serialNumber,
        }),
      ];

      if (this.battery) {
        accessories.push(
          new FroniusAccessory({
            hap,
            log: this.log,
            metering: 'Battery charging',
            froniusApi: this.froniusApi,
            pollInterval: this.pollInterval,
            model: deviceMetdata?.model,
            serialNumber: deviceMetdata?.serialNumber,
          }),
          new FroniusAccessory({
            hap,
            log: this.log,
            metering: 'Battery discharging',
            froniusApi: this.froniusApi,
            pollInterval: this.pollInterval,
            model: deviceMetdata?.model,
            serialNumber: deviceMetdata?.serialNumber,
          }),
          new FroniusAccessory({
            hap,
            log: this.log,
            metering: 'Battery %',
            froniusApi: this.froniusApi,
            pollInterval: this.pollInterval,
            model: deviceMetdata?.model,
            serialNumber: deviceMetdata?.serialNumber,
          }),
        );
      }

      callback(accessories);
    })();
  }

  private async getDeviceMetadata(): Promise<
    { model: string; serialNumber: string } | undefined
    > {
    const [inverterInfo, deviceDbData] = await Promise.all([
      (await this.froniusApi.getInverterInfo())?.Body.Data,
      (await this.froniusApi.getDeviceDbData())?.Inverters,
    ]);

    if (!inverterInfo || !deviceDbData) {
      return;
    }

    const model = Object.values(inverterInfo)
      .map((inverter) =>
        deviceDbData[inverter.DT].ProductName
          // remove Fronius from the name since it's already in the manufacturer field
          .replace('Fronius', '')
          .trim(),
      )
      .join(' & ');

    const serialNumber = Object.values(inverterInfo)
      .map((inverter) => inverter.UniqueID)
      .join(' & ');

    return {
      model,
      serialNumber,
    };
  }
}
