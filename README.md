# homebridge-fronius-inverter-lights
 Homebridge plugin for Fronius inverter with smart meter as a lightbulb accessory
 
- Adds lightbulb accessories
  - Export - net export (lightbulb brightness % relative to solar generation)
  - Import - net import (lightbulb brightness % relative to solar generation)
  - Load - the amount of grid load
  - PV - the amount of solar generation (lightbulb brightness % relative to max PV capacity)
  - (If battery) Battery % - the battery state of charge (average)
  - (If battery) Battery charging - the battery charging rate
  - (If battery) Battery discharging - the battery discharging rate
- Lightbulb brightness lux represents watts

## Screenshots

<img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot1.JPEG" width="250"><img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot2.JPEG" width="250"><img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot3.JPEG" width="250">

## Install

```
npm i -g homebridge-fronius-inverter-lights@latest
```

## Homebridge config

```javascript
    "platforms": [
        {
            "name": "Fronius inverter",
            "platform": "FroniusInverterLightsPlatform",
            "inverterIp": "192.168.1.124",
            "pollInterval": 2,
            "pvMaxPower": 6000,
            "battery": false
        },

```
- `name` (required) the name of the plugin instance
- `platform` (required) the name of the plugin, must be `FroniusInverterLightsPlatform`
- `inverterIp` (required) the IP address of your Fronius inverter
- `pollInterval` (required) the polling frequency in seconds
- `pvMaxPower` (optional) the max capacity of your PV in watts (to show the PV lightbulb brightness % as a percentage of your max capacity)
- `battery` (optional) enable battery accessory to show your battery SOC and usage
- 
