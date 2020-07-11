import axios, { AxiosInstance } from "axios"

export class FroniusApi {
	private http: AxiosInstance;
	private inverterIp: string;

	constructor(inverterIp: string) {
		this.inverterIp = inverterIp;

		this.http = axios.create({
			timeout: 2000,
		});
	}

	public getInverterData = async () => {
		try {
			return await this.http.get(
				"http://" + this.inverterIp + "/solar_api/v1/GetPowerFlowRealtimeData.fcgi"
			);
		} catch (error) {
			console.error(error);
			return null;
		}
	};
}