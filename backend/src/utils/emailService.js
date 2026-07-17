import nodemailer from "nodemailer";

const paymentLabels = {
  UPI_PAY: "UPI Pay",
  UPI_QR: "UPI QR",
  PAYMENT_LINK: "Payment Link",
  SCREENSHOT: "Screenshot Proof"
};

const isEmailReady = () => Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.OWNER_EMAIL
);

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;

const orderLines = (order) => (order.items || [])
  .map((item) => `${item.name} x ${item.quantity} - ${formatCurrency(Number(item.price) * Number(item.quantity))}`)
  .join("\n");

export const sendOwnerOrderEmail = async (order) => {
  if (!isEmailReady()) {
    console.log("Email notification skipped. SMTP env variables are not configured.");
    return;
  }

  const customer = order.customer || {};
  const orderId = order._id || order.id;
  const paymentMethod = paymentLabels[order.paymentMethod] || order.paymentMethod || "Payment";

  const text = [
    "New order received on Manan Accessories.",
    "",
    `Order ID: ${orderId}`,
    `Amount: ${formatCurrency(order.payableAmount)}`,
    `Payment Status: ${order.paymentStatus}`,
    `Order Status: ${order.orderStatus}`,
    `Payment Method: ${paymentMethod}`,
    `Transaction ID: ${order.transactionId || "N/A"}`,
    "",
    "Customer Details",
    `Name: ${customer.name || "N/A"}`,
    `Phone: ${customer.phone || "N/A"}`,
    `Email: ${customer.email || "N/A"}`,
    `Address: ${customer.address || "N/A"}`,
    "",
    "Products",
    orderLines(order),
    order.paymentScreenshot ? `\nPayment Screenshot: ${order.paymentScreenshot}` : ""
  ].join("\n");

  const htmlItems = (order.items || [])
    .map((item) => `<li><strong>${item.name}</strong> x ${item.quantity} - ${formatCurrency(Number(item.price) * Number(item.quantity))}</li>`)
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#18211f;line-height:1.5">
      <h2>New order received</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Amount:</strong> ${formatCurrency(order.payableAmount)}</p>
      <p><strong>Payment:</strong> ${order.paymentStatus} via ${paymentMethod}</p>
      <p><strong>Order Status:</strong> ${order.orderStatus}</p>
      <p><strong>Transaction ID:</strong> ${order.transactionId || "N/A"}</p>

      <h3>Customer Details</h3>
      <p>
        <strong>Name:</strong> ${customer.name || "N/A"}<br/>
        <strong>Phone:</strong> ${customer.phone || "N/A"}<br/>
        <strong>Email:</strong> ${customer.email || "N/A"}<br/>
        <strong>Address:</strong> ${customer.address || "N/A"}
      </p>

      <h3>Products</h3>
      <ul>${htmlItems}</ul>

      ${order.paymentScreenshot ? `<p><a href="${order.paymentScreenshot}">View payment screenshot</a></p>` : ""}
    </div>
  `;

  try {
    await createTransporter().sendMail({
      from: `"Manan Accessories" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: `New order ${orderId} - ${formatCurrency(order.payableAmount)}`,
      text,
      html
    });
  } catch (error) {
    console.error("Owner email notification failed:", error.message);
  }
};
