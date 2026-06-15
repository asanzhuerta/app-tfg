export class OrderServiceError extends Error {
	status: number;
	code: string;

	constructor(message: string, status = 400, code = "ORDER_SERVICE_ERROR") {
		super(message);
		this.name = "OrderServiceError";
		this.status = status;
		this.code = code;
	}
}
