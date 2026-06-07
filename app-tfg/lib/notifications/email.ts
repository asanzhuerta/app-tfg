import nodemailer from "nodemailer";

type EmailDeliveryInput = {
	to: string;
	subject: string;
	text: string;
	html?: string;
};

type EmailDeliveryResult =
	| { status: "sent" }
	| { status: "skipped"; reason: "not_configured" | "missing_recipient" }
	| { status: "failed"; reason: string };

function getSmtpPort() {
	const rawPort = process.env.SMTP_PORT;
	const parsed = rawPort ? Number(rawPort) : 587;

	return Number.isInteger(parsed) && parsed > 0 ? parsed : 587;
}

function getSmtpSecure(port: number) {
	if (process.env.SMTP_SECURE) {
		return process.env.SMTP_SECURE === "true";
	}

	return port === 465;
}

function getSmtpConfig() {
	const host = process.env.SMTP_HOST?.trim();
	const user = process.env.SMTP_USER?.trim();
	const password =
		process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim();
	const from =
		process.env.SMTP_FROM?.trim() ||
		process.env.MAIL_FROM?.trim() ||
		process.env.SMTP_USER?.trim();

	if (!host || !user || !password || !from) {
		return null;
	}

	const port = getSmtpPort();

	return {
		host,
		port,
		secure: getSmtpSecure(port),
		auth: {
			user,
			pass: password,
		},
		from,
	};
}

export function isEmailDeliveryConfigured() {
	return Boolean(getSmtpConfig());
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function buildNotificationEmailHtml(input: {
	title: string;
	body: string;
	actionUrl?: string | null;
}) {
	const safeTitle = escapeHtml(input.title);
	const safeBody = escapeHtml(input.body).replace(/\n/g, "<br />");
	const safeActionUrl = input.actionUrl ? escapeHtml(input.actionUrl) : null;

	return [
		"<div style=\"font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:620px\">",
		`<h1 style=\"font-size:20px;margin:0 0 12px\">${safeTitle}</h1>`,
		`<p style=\"font-size:14px;margin:0 0 18px\">${safeBody}</p>`,
		safeActionUrl
			? `<p><a href=\"${safeActionUrl}\" style=\"display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;padding:10px 14px;font-size:14px\">Abrir aviso</a></p>`
			: "",
		"<p style=\"font-size:12px;color:#64748b;margin-top:24px\">Este mensaje se ha enviado desde Kinestilistas.</p>",
		"</div>",
	].join("");
}

export async function sendNotificationEmail(
	input: EmailDeliveryInput,
): Promise<EmailDeliveryResult> {
	const to = input.to.trim();

	if (!to) {
		return { status: "skipped", reason: "missing_recipient" };
	}

	const config = getSmtpConfig();

	if (!config) {
		return { status: "skipped", reason: "not_configured" };
	}

	try {
		const transporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: config.auth,
		});

		await transporter.sendMail({
			from: config.from,
			to,
			subject: input.subject,
			text: input.text,
			html: input.html,
		});

		return { status: "sent" };
	} catch (error) {
		const reason = error instanceof Error ? error.message : "unknown_error";
		console.error("[notifications/email] delivery failed:", reason);
		return { status: "failed", reason };
	}
}
