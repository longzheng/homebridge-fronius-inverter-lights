# homebridge-fronius-inverter-lights
 Homebridge plugin for Fronius inverter with smart meter as a lightbulb accessory
 
- Adds lightbulb accessories
 - Export - net export
 - Import - net import
 - Load - the amount of grid load
 - PV - the amount of solar generation
- Lightbulb brightness percentage represents how much of the import/export relative to the solar generation
- Lightbulb brightness lux represents how many watts

## Screenshots

<img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot1.PNG" width="400"><img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot2.PNG" width="400">

## Install

```
npm i -g homebridge-fronius-inverter-lights@latest
```

## Homebridge config

```
    "platforms": [
        {
            "name": "Fronius inverter",
            "platform": "FroniusInverterLightsPlatform",
            "inverterIp": "192.168.1.124", // IP address of your Fronius inverter
            "pollInterval": 2 // polling frequency, in seconds
        },

```
