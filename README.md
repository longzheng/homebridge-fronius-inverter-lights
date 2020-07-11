# homebridge-fronius-inverter-lights
 Homebridge plugin for Fronius inverter with smart meter as a lightbulb accessory

## Screenshots

![image](https://github.com/longzheng/homebridge-fronius-inverter-lights/blob/master/docs/screenshot1.png)
![image](https://github.com/longzheng/homebridge-fronius-inverter-lights/blob/master/docs/screenshot2.png)

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