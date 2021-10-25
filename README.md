# homebridge-fronius-inverter-lights
 Homebridge plugin for Fronius inverter with smart meter as a lightbulb accessory
 
- Adds lightbulb accessories
  - Export - net export (lightbulb brightness % relative to solar generation)
  - Import - net import (lightbulb brightness % relative to solar generation)
  - Load - the amount of grid load
  - PV - the amount of solar generation (lightbulb brightness % relative to max PV capacity)
- Lightbulb brightness lux represents watts

## Screenshots

<img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot1.JPEG" width="250"><img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot2.JPEG" width="250"><img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot3.JPEG" width="250">

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
            "pvMaxPower": 6000 // optional: shows the PV lightbulb brightness % as a proportion to the max PV capacity
        },

```
