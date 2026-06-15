import { spawnSync } from "node:child_process";
import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scripts = process.argv.slice(2);

if (scripts.length === 0) {
	console.error("Uso: node ./scripts/run-test-suite.mjs <npm-script> [...]");
	process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
	readFileSync(join(__dirname, "..", "package.json"), "utf8"),
);
const depth = Number.parseInt(process.env.TEST_SUITE_DEPTH ?? "0", 10) || 0;
const isRootSuite = !process.env.TEST_SUITE_SUMMARY_FILE;
const summaryFile =
	process.env.TEST_SUITE_SUMMARY_FILE ??
	join(tmpdir(), `kinestilistas-suite-${process.pid}-${Date.now()}.jsonl`);

if (isRootSuite) {
	mkdirSync(dirname(summaryFile), { recursive: true });
	writeFileSync(summaryFile, "", "utf8");
}

const colorEnabled =
	process.env.NO_COLOR === undefined && process.env.FORCE_COLOR !== "0";
const color = (code, value) =>
	colorEnabled ? `\x1b[${code}m${value}\x1b[0m` : value;
const bold = (value) => color("1", value);
const dim = (value) => color("2", value);
const green = (value) => color("32", value);
const red = (value) => color("31", value);
const cyan = (value) => color("36", value);
const yellow = (value) => color("33", value);

function isCompositeScript(scriptName) {
	return packageJson.scripts?.[scriptName]?.includes("run-test-suite.mjs") ?? false;
}

function formatDuration(ms) {
	if (ms < 1000) {
		return `${ms} ms`;
	}

	return `${(ms / 1000).toFixed(1)} s`;
}

function writeSummaryRecord(scriptName, elapsedMs) {
	if (isCompositeScript(scriptName)) {
		return;
	}

	appendFileSync(
		summaryFile,
		`${JSON.stringify({
			scriptName,
			elapsedMs,
			depth,
			finishedAt: new Date().toISOString(),
		})}\n`,
		"utf8",
	);
}

function readSummaryRecords() {
	if (!existsSync(summaryFile)) {
		return [];
	}

	return readFileSync(summaryFile, "utf8")
		.split(/\r?\n/)
		.filter(Boolean)
		.map((line) => JSON.parse(line));
}

function printSuiteHeader(scriptName, index, total) {
	const indent = "  ".repeat(depth);
	const position = `[${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}]`;
	const line = "-".repeat(Math.max(36, scriptName.length + 14));

	console.log("");
	console.log(`${indent}${dim(line)}`);
	console.log(`${indent}${cyan(position)} ${bold(scriptName)}`);
	console.log(`${indent}${dim(line)}`);
}

function printFinalSummary(title = "Resumen final de pruebas superadas") {
	const records = readSummaryRecords();
	const totalTime = records.reduce((total, record) => total + record.elapsedMs, 0);

	console.log("");
	console.log(bold(green(title)));
	console.log(dim("-".repeat(title.length)));

	if (records.length === 0) {
		console.log(yellow("[ ] No se han registrado pruebas hoja."));
		return;
	}

	for (const [index, record] of records.entries()) {
		const itemNumber = String(index + 1).padStart(2, "0");
		const duration = dim(`(${formatDuration(record.elapsedMs)})`);
		console.log(`${green("[x]")} ${itemNumber}. ${record.scriptName} ${duration}`);
	}

	console.log("");
	console.log(
		green(
			`OK ${records.length} comprobaciones ejecutadas correctamente en ${formatDuration(totalTime)}`,
		),
	);
}

function runNpmScript(scriptName) {
	const command =
		process.platform === "win32"
			? ["cmd.exe", ["/d", "/s", "/c", "npm", "run", scriptName]]
			: ["npm", ["run", scriptName]];

	const startedAt = Date.now();
	const result = spawnSync(command[0], command[1], {
		stdio: "inherit",
		shell: false,
		env: {
			...process.env,
			TEST_SUITE_DEPTH: String(depth + 1),
			TEST_SUITE_SUMMARY_FILE: summaryFile,
		},
	});
	const elapsedMs = Date.now() - startedAt;

	if (result.error) {
		console.error(red(result.error.message));
	}

	return {
		status: result.status ?? 1,
		elapsedMs,
	};
}

for (const [index, scriptName] of scripts.entries()) {
	printSuiteHeader(scriptName, index, scripts.length);
	const { status, elapsedMs } = runNpmScript(scriptName);

	if (status !== 0) {
		console.error("");
		console.error(red(`Suite detenida en ${scriptName}`));

		if (isRootSuite) {
			printFinalSummary("Pruebas superadas antes del fallo");
		}

		process.exit(status);
	}

	writeSummaryRecord(scriptName, elapsedMs);
	console.log(green(`OK ${scriptName} (${formatDuration(elapsedMs)})`));
}

console.log("");
console.log(green("Suite completada correctamente"));

if (isRootSuite) {
	printFinalSummary();
	rmSync(summaryFile, { force: true });
}
