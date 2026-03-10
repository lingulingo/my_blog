import nodemailer from "nodemailer";

function getSmtpPort() {
  const rawPort = process.env.SMTP_PORT;
  if (!rawPort) {
    throw new Error("SMTP_PORT 未配置");
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT 配置不合法");
  }

  return port;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASS 未完整配置");
  }

  const port = getSmtpPort();
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("SMTP_FROM 或 SMTP_USER 未配置");
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to: params.to,
    subject: "重置你的灵寒谷密码",
    text: `你正在请求重置密码。\n\n请在 30 分钟内打开以下链接完成重置：\n${params.resetUrl}\n\n如果这不是你的操作，请忽略这封邮件。`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
        <h2 style="margin-bottom: 16px;">重置你的灵寒谷密码</h2>
        <p>你正在请求重置密码。</p>
        <p>请在 30 分钟内点击下方链接完成重置：</p>
        <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
        <p>如果这不是你的操作，请直接忽略这封邮件。</p>
      </div>
    `,
  });
}
