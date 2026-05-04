const sgMail = require("@sendgrid/mail");

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@rentmanager.app";

const formatMoney = (amount) => `Rs. ${Number(amount).toFixed(2)}`;

const formatDate = (dueDate) => {
  if (typeof dueDate === "string") {
    return dueDate;
  }

  return new Date(dueDate).toISOString().slice(0, 10);
};

const sendReminder = async (email, amount, dueDate) => {
  const formattedAmount = formatMoney(amount);
  const formattedDueDate = formatDate(dueDate);

  if (!process.env.SENDGRID_API_KEY) {
    console.log(
      `[EMAIL SKIP] No SendGrid key. Would send reminder to ${email}: ${formattedAmount} due ${formattedDueDate}`
    );
    return false;
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: "Rent Reminder",
    text: `Your rent of ${formattedAmount} is due on ${formattedDueDate}. Please ensure timely payment to avoid late fees.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a73e8;">Rent Reminder</h2>
        <p>Hello,</p>
        <p>This is a friendly reminder that your rent payment is due soon:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Amount</td>
            <td style="padding: 8px;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Due Date</td>
            <td style="padding: 8px;">${formattedDueDate}</td>
          </tr>
        </table>
        <p>Please ensure timely payment to avoid late fees.</p>
        <p style="color: #888; font-size: 12px;">Rent Management System</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[EMAIL] Reminder sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${email}:`, error.message);
    return false;
  }
};

const sendLateFeeNotice = async (email, amount, lateFee, dueDate) => {
  const formattedAmount = formatMoney(amount);
  const formattedLateFee = formatMoney(lateFee);
  const formattedDueDate = formatDate(dueDate);
  const totalDue = formatMoney(Number(amount) + Number(lateFee));

  if (!process.env.SENDGRID_API_KEY) {
    console.log(
      `[EMAIL SKIP] No SendGrid key. Would send late fee notice to ${email}: ${formattedLateFee} on ${formattedAmount}`
    );
    return false;
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: "Late Fee Applied - Overdue Rent",
    text: `A late fee of ${formattedLateFee} has been applied to your overdue rent of ${formattedAmount} (due ${formattedDueDate}). Total now due: ${totalDue}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #d93025;">Late Fee Notice</h2>
        <p>Hello,</p>
        <p>A late fee has been applied to your overdue rent:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Original Amount</td>
            <td style="padding: 8px;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Due Date</td>
            <td style="padding: 8px;">${formattedDueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #d93025;">Late Fee (2%)</td>
            <td style="padding: 8px; color: #d93025;">${formattedLateFee}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px; font-weight: bold;">Total Due</td>
            <td style="padding: 8px; font-weight: bold;">${totalDue}</td>
          </tr>
        </table>
        <p>Please make your payment as soon as possible.</p>
        <p style="color: #888; font-size: 12px;">Rent Management System</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[EMAIL] Late fee notice sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send late fee notice to ${email}:`, error.message);
    return false;
  }
};

module.exports = { sendReminder, sendLateFeeNotice };
