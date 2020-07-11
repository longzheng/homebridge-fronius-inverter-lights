# homebridge-fronius-inverter-lights
 Homebridge plugin for Fronius inverter with smart meter as a lightbulb accessory
 
- Adds 2 `Import` and `Export` lightbulb accessories
- Lightbulb switched on signifies if the household is net importing or exporting
- Lightbulb brightness percentage represents how much of the energy consumed/generated is imported from grid/exported to grid
- Lightbulb brightness lux represents how many watts are being imported or exported

## Screenshots

<img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot1.PNG" width="400"><img src="https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot2.PNG" width="400">

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
