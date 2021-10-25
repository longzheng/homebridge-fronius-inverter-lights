import { AccessoryPlugin, HAP, Logging, Service } from 'homebridge';
import { FroniusApi } from './fronius-api';

export type Metering = 'Import' | 'Export' | 'Load' | 'PV';

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

  constructor(
    hap: HAP,
    log: Logging,
    metering: Metering,
    froniusApi: FroniusApi,
    pollInterval: number,
    pvMaxPower?: number,
  ) {
    this.hap = hap;
    this.log = log;
    this.name = metering.toString();
    this.froniusApi = froniusApi;
    this.metering = metering;
    this.pollInterval = pollInterval;
    this.pvMaxPower = pvMaxPower;

    this.lightbulbService = new hap.Service.Lightbulb(this.name);
    this.lightsensorService = new hap.Service.LightSensor(this.name);

    this.lightsensorService
      .getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel)
      .setProps({
        minValue: 0, // allow minimum lux to be 0, otherwise defaults to 0.0001
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Fronius')
      .setCharacteristic(hap.Characteristic.Model, 'Inverter');

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
    const data = await this.froniusApi.getInverterData();

    if (data) {
      switch (this.metering) {
        case 'Export':
        case 'Import': {
          const gridValue = data.P_Grid;
          const autonomyValue = data.rel_Autonomy;
          const selfConsumptionValue = data.rel_SelfConsumption || 100;
          const isImport = this.metering === 'Import';

          this.onValue =
            (isImport ? autonomyValue : selfConsumptionValue) < 100; // on/off is calculated whether autonomy/selfConsumption is less than 100
          this.brightnessValue =
            100 - (isImport ? autonomyValue : selfConsumptionValue); // percentage of import/export is calculated from 100 - autonomy/selfConsumption
          this.luxValue = isImport
            ? gridValue > 0
              ? gridValue
              : 0 // import watts, value must be positive
            : gridValue < 0
              ? -gridValue
              : 0; // export watts, value must be negative
          break;
        }
        case 'Load': {
          const loadValue = Math.abs(data.P_Load);
          this.brightnessValue = 100;
          this.onValue = loadValue > 0;
          this.luxValue = loadValue;
          break;
        }
        case 'PV': {
          const pvValue = data.P_PV;
          this.brightnessValue = this.pvMaxPower
            ? ((pvValue ?? 0) / this.pvMaxPower) * 100
            : 100;
          this.onValue = pvValue !== null;
          this.luxValue = pvValue ?? 0;
          break;
        }
      }
    } else {
      this.onValue = new Error('Error fetching value');
      this.brightnessValue = new Error('Error fetching value');
      this.luxValue = new Error('Error fetching value');
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
