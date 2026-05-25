require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PayOS } = require("@payos/node");

const app = express();
app.use(cors());
app.use(express.json());

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

let orders = {};

app.get("/", (req, res) => {
  res.send("PayOS backend is running");
});

app.post("/create-payment", async (req, res) => {
  try {
    const orderCode = Number(Date.now().toString().slice(-6));
    const amount = 150000;

    const paymentLink = await payOS.paymentRequests.create({
      orderCode,
      amount,
      description: "DH" + orderCode,
      returnUrl: "https://phanngoquocbao1239a6.github.io",
      cancelUrl: "https://phanngoquocbao1239a6.github.io",
      items: [
        {
          name: "Tai nghe Bluetooth MusicBox Pro",
          quantity: 1,
          price: amount,
        },
      ],
    });

    orders[orderCode] = "PENDING";

    res.json({
      orderCode,
      description: "DH" + orderCode,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/webhook", (req, res) => {
  try {
    const data = payOS.webhooks.verify(req.body);

    console.log("Webhook PayOS:", data);

    if (data.orderCode) {
      orders[data.orderCode] = "PAID";
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

app.get("/payment-status/:orderCode", (req, res) => {
  const status = orders[req.params.orderCode] || "PENDING";
  res.json({ status });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("PayOS backend running");
});
