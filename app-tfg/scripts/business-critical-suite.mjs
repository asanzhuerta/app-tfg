import { spawnSync } from "node:child_process";

function runNpmScript(scriptName) {
	if (process.platform === "win32") {
		return spawnSync("cmd.exe", ["/d", "/s", "/c", "npm", "run", scriptName], {
			stdio: "inherit",
			shell: false,
		});
	}

	return spawnSync("npm", ["run", scriptName], {
		stdio: "inherit",
		shell: false,
	});
}

const steps = [
	["test:m2:route-points", "calculo de puntos de ruta"],
	["test:m4:orders-delivery", "ciclo de pedido, reparto y entrega"],
	["test:m4:payments", "cobros parciales e historial"],
	["test:m6:promotions", "promociones en borrador y pedido"],
];

for (const [scriptName, label] of steps) {
	console.log(`\n== ${label} (${scriptName}) ==`);

	const result = runNpmScript(scriptName);

	if (result.status !== 0) {
		if (result.error) {
			console.error(result.error.message);
		}

		console.error(`\nSuite critica de negocio FALLIDA en ${scriptName}`);
		process.exit(result.status ?? 1);
	}
}

console.log("\nSuite critica de negocio OK");
