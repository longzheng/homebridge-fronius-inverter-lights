# homebridge-fronius-inverter-lights
 Homebridge plugin for Fronius inverter with smart meter as a lightbulb accessory

## Screenshots

![image](https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot1.PNG)
![image](https://raw.githubusercontent.com/longzheng/homebridge-fronius-inverter-lights/master/docs/screenshot2.PNG)

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
