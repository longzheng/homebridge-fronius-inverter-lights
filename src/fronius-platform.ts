import {
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  PlatformConfig,
  StaticPlatformPlugin,
} from 'homebridge';
import { FroniusAccessory, Metering } from './fronius-accessory';
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

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;

    // probably parse config or something here
    this.froniusApi = new FroniusApi(config.inverterIp, this.log);
    this.pollInterval = config.pollInterval || 10;
  }

  /*
   * This method is called to retrieve all accessories exposed by the platform.
   * The Platform can delay the response my invoking the callback at a later time,
   * it will delay the bridge startup though, so keep it to a minimum.
   * The set of exposed accessories CANNOT change over the lifetime of the plugin!
   */
  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback([
      new FroniusAccessory(
        hap,
        this.log,
        Metering.Import,
        this.froniusApi,
        this.pollInterval,
      ),
      new FroniusAccessory(
        hap,
        this.log,
        Metering.Export,
        this.froniusApi,
        this.pollInterval,
      ),
    ]);
  }
}
