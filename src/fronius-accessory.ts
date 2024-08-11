import { AccessoryPlugin, HAP, Logging, Service } from 'homebridge';
import { FroniusApi } from './fronius-api';

export type Metering =
  | 'Import'
  | 'Export'
  | 'Load'
  | 'PV'
  | 'Battery charging'
  | 'Battery discharging'
  | 'Battery %';

export class FroniusAccessory implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly froniusApi: FroniusApi;
  private readonly name: string;
  private readonly lightbulbService: Service;
  private readonly lightsensorService: Service;
  private readonly informationService: Service;
  private readonly hap: HAP;
  private readonly metering: Metering;
  private readonly pollInterval: number;
  private readonly pvMaxPower?: number;

  private onValue: boolean | Error = false;
  private brightnessValue: number | Error = 0;
  private luxValue: number | Error = 0;

  constructor({
    hap,
    log,
    metering,
    froniusApi,
    pollInterval,
    pvMaxPower,
    model,
    serialNumber,
  }: {
    hap: HAP;
    log: Logging;
    metering: Metering;
    froniusApi: FroniusApi;
    pollInterval: number;
    pvMaxPower?: number;
    model?: string;
    serialNumber?: string;
  }) {
    this.hap = hap;
    this.log = log;
    this.name = metering.toString();
    this.froniusApi = froniusApi;
    this.metering = metering;
    this.pollInterval = pollInterval;
    this.pvMaxPower = pvMaxPower;

    this.lightbulbService = new hap.Service.Lightbulb(this.name);
    this.lightsensorService = new hap.Service.LightSensor(this.name);

    this.lightbulbService
      .getCharacteristic(hap.Characteristic.On)
      .onGet(() => {
        if (this.onValue instanceof Error) {
          return null;
        }

        return this.onValue;
      })
      .onSet(() => {
        if (this.onValue instanceof Error) {
          return null;
        }

        return this.onValue;
      });

    this.lightbulbService
      .getCharacteristic(hap.Characteristic.Brightness)
      .onGet(() => {
        if (this.brightnessValue instanceof Error) {
          return null;
        }

        return this.brightnessValue;
      })
      .onSet(() => {
        if (this.brightnessValue instanceof Error) {
          return null;
        }

        return this.brightnessValue;
      });

    this.lightsensorService
      .getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel)
      .setProps({
        minValue: 0, // allow minimum lux to be 0, otherwise defaults to 0.0001
      })
      .onGet(() => {
        if (this.luxValue instanceof Error) {
          return null;
        }

        return this.luxValue;
      });

    this.informationService =
      new hap.Service.AccessoryInformation().setCharacteristic(
        hap.Characteristic.Manufacturer,
        'Fronius',
      );

    if (model) {
      this.informationService.setCharacteristic(
        hap.Characteristic.Model,
        model,
      );
    }

    if (serialNumber) {
      this.informationService.setCharacteristic(
        hap.Characteristic.SerialNumber,
        serialNumber,
      );
    }

    setInterval(async () => {
      await this.scheduledUpdate();
    }, this.pollInterval * 1000);

    // run immediately too
    this.scheduledUpdate();
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.informationService,
      this.lightbulbService,
      this.lightsensorService,
    ];
  }

  async updateValues() {
    const data = (await this.froniusApi.getPowerFlowRealtimeData())?.Body.Data;

    if (!data) {
      this.onValue = new Error('Error fetching value');
      this.brightnessValue = new Error('Error fetching value');
      this.luxValue = new Error('Error fetching value');
      return;
    }

    // P_Akku should be positive when discharging and negative when charging
    const batteryValue = data.Site.P_Akku ?? 0;
    const batteryState =
      batteryValue < 0 ? 'charging' : batteryValue > 0 ? 'discharging' : 'idle';

    switch (this.metering) {
      case 'Export': {
        const gridValue = data.Site.P_Grid;
        const selfConsumptionValue = data.Site.rel_SelfConsumption ?? 100;

        this.onValue =
          // on/off is calculated whether selfConsumption is less than 100
          selfConsumptionValue < 100;
        this.brightnessValue =
          // percentage of export is calculated from 100 - selfConsumption
          100 - selfConsumptionValue;
        this.luxValue = gridValue < 0
          ? -gridValue // export watts, value must be negative
          : 0;
        break;
      }
      case 'Import': {
        const gridValue = data.Site.P_Grid;
        const autonomyValue = data.Site.rel_Autonomy;
        
        this.onValue =
          // on/off is calculated whether autonomy is less than 100
          autonomyValue < 100;
        this.brightnessValue =
          // percentage of import/export is calculated from 100 - autonomy
          100 - autonomyValue;
        this.luxValue = gridValue > 0
          ? gridValue // import watts, value must be positive
          : 0; 
        break;
      }
      case 'Load': {
        const loadValue = Math.abs(data.Site.P_Load);
        this.brightnessValue = 100;
        this.onValue = loadValue > 0;
        this.luxValue = loadValue;
        break;
      }
      case 'PV': {
        const pvValue = data.Site.P_PV;
        this.brightnessValue = this.pvMaxPower
          ? Math.min(
            ((pvValue ?? 0) / this.pvMaxPower) * 100, // calculate PV output as a percentage of PV max power
            100,
          ) // cap to 100%
          : 100;
        this.onValue = pvValue !== null;
        this.luxValue = pvValue ?? 0;
        break;
      }
      case 'Battery %': {
        // if the site has multiple inverters, average all the inverter SOCs
        const socs = Object.values(data.Inverters).map((inv) => inv.SOC ?? 0);
        const socAvg = socs.reduce((a, b) => a + b, 0) / socs.length;
        this.brightnessValue = socAvg;
        this.onValue = socAvg > 0;
        break;
      }
      case 'Battery charging': {
        const isCharging = batteryState === 'charging';
        this.brightnessValue = isCharging ? 100 : 0;
        this.onValue = isCharging;
        this.luxValue = Math.abs(batteryValue);
        break;
      }
      case 'Battery discharging': {
        const isDischarging = batteryState === 'discharging';
        this.brightnessValue = isDischarging ? 100 : 0;
        this.onValue = isDischarging;
        this.luxValue = Math.abs(batteryValue);
        break;
      }
    }
  }

  async scheduledUpdate() {
    await this.updateValues();

    this.lightbulbService
      .getCharacteristic(this.hap.Characteristic.On)
      .updateValue(this.onValue);

    this.lightbulbService
      .getCharacteristic(this.hap.Characteristic.Brightness)
      .updateValue(this.brightnessValue);

    this.lightsensorService
      .getCharacteristic(this.hap.Characteristic.CurrentAmbientLightLevel)
      .updateValue(this.luxValue);
  }
}
