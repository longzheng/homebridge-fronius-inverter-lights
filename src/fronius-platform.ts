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
    const accessories = [
      new FroniusAccessory(
        hap,
        this.log,
        'Import',
        this.froniusApi,
        this.pollInterval,
      ),
      new FroniusAccessory(
        hap,
        this.log,
        'Export',
        this.froniusApi,
        this.pollInterval,
      ),
      new FroniusAccessory(
        hap,
        this.log,
        'Load',
        this.froniusApi,
        this.pollInterval,
      ),
      new FroniusAccessory(
        hap,
        this.log,
        'PV',
        this.froniusApi,
        this.pollInterval,
        this.pvMaxPower,
      ),
    ];

    if (this.battery) {
      accessories.push(
        new FroniusAccessory(
          hap,
          this.log,
          'Battery charging',
          this.froniusApi,
          this.pollInterval,
        ),
        new FroniusAccessory(
          hap,
          this.log,
          'Battery discharging',
          this.froniusApi,
          this.pollInterval,
        ),
        new FroniusAccessory(
          hap,
          this.log,
          'Battery %',
          this.froniusApi,
          this.pollInterval,
        ),
      );
    }

    callback(accessories);
  }
}
