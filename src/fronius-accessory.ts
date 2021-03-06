import {
  AccessoryPlugin,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
  CharacteristicEventTypes,
} from 'homebridge';
import { FroniusApi } from './fronius-api';

export enum Metering {
  Import = 'Import',
  Export = 'Export',
}

const GridProperty = 'P_Grid';
const AutonomyProperty = 'rel_Autonomy';
const SelfConsumptionProperty = 'rel_SelfConsumption';

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
  private onValue = false;
  private brightnessValue = 0;
  private luxValue = 0;

  constructor(
    hap: HAP,
    log: Logging,
    metering: Metering,
    froniusApi: FroniusApi,
    pollInterval: number,
  ) {
    this.hap = hap;
    this.log = log;
    this.name = metering.toString();
    this.froniusApi = froniusApi;
    this.metering = metering;
    this.pollInterval = pollInterval;

    this.lightbulbService = new hap.Service.Lightbulb(this.name);
    this.lightsensorService = new hap.Service.LightSensor(this.name);

    this.lightbulbService
      .getCharacteristic(hap.Characteristic.Brightness)
      .on(
        CharacteristicEventTypes.GET,
        async (callback: CharacteristicGetCallback) => {
          await this.updateValues();

          callback(undefined, this.brightnessValue);
        },
      )
      .on(
        CharacteristicEventTypes.SET,
        async (
          value: CharacteristicValue,
          callback: CharacteristicSetCallback,
        ) => {
          await this.updateValues();

          callback(undefined, this.brightnessValue);
        },
      );

    this.lightbulbService
      .getCharacteristic(hap.Characteristic.On)
      .on(
        CharacteristicEventTypes.GET,
        async (callback: CharacteristicGetCallback) => {
          await this.updateValues();

          callback(undefined, this.onValue);
        },
      )
      .on(
        CharacteristicEventTypes.SET,
        async (
          value: CharacteristicValue,
          callback: CharacteristicSetCallback,
        ) => {
          await this.updateValues();

          callback(undefined, this.onValue);
        },
      );

    this.lightsensorService
      .getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel)
      .on(
        CharacteristicEventTypes.GET,
        async (callback: CharacteristicGetCallback) => {
          await this.updateValues();

          callback(undefined, this.luxValue);
        },
      )
      .setProps({
        minValue: 0, // allow minimum lux to be 0, otherwise defaults to 0.0001
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Custom Manufacturer')
      .setCharacteristic(hap.Characteristic.Model, 'Custom Model');
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    setInterval(async () => {
      await this.scheduledUpdate();
    }, this.pollInterval * 1000);

    return [
      this.informationService,
      this.lightbulbService,
      this.lightsensorService,
    ];
  }

  async updateValues() {
    const data = await this.getInverterData();

    if (data) {
      const gridValue = data[GridProperty];
      const autonomyValue = data[AutonomyProperty];
      const selfConsumptionValue = data[SelfConsumptionProperty] || 100;
      const isImport = this.metering === Metering.Import;

      this.onValue = (isImport ? autonomyValue : selfConsumptionValue) < 100; // on/off is calculated whether autonomy/selfConsumption is less than 100
      this.brightnessValue =
        100 - (isImport ? autonomyValue : selfConsumptionValue); // percentage of import/export is calculated from 100 - autonomy/selfConsumption
      this.luxValue = isImport
        ? gridValue > 0
          ? gridValue
          : 0 // import watts, value must be positive
        : gridValue < 0
          ? -gridValue
          : 0; // export watts, value must be negative
    } else {
      this.onValue = false;
      this.brightnessValue = 0;
      this.luxValue = 0;
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

  getInverterData() {
    return this.froniusApi.getInverterData().then(
      (result) => {
        if (result) {
          return result.data.Body.Data.Site;
        } else {
          return null;
        }
      },
      (error) => {
        return null;
      },
    );
  }
}
