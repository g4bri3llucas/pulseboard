import nodemailer from 'nodemailer';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) =>
      nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      }),
    );
  }
  return transporterPromise;
}

export const emailService = {
  async sendIncidentAlert(to: string, monitorName: string, kind: 'opened' | 'resolved') {
    const transporter = await getTransporter();

    const subject =
      kind === 'opened'
        ? `🔴 ${monitorName} is DOWN`
        : `🟢 ${monitorName} is back UP`;

    const info = await transporter.sendMail({
      from: '"PulseBoard" <alerts@pulseboard.dev>',
      to,
      subject,
      text:
        kind === 'opened'
          ? `Your monitor "${monitorName}" stopped responding.`
          : `Your monitor "${monitorName}" is responding again.`,
    });

    console.log(`[email sent] preview: ${nodemailer.getTestMessageUrl(info)}`);
  },
};