import "dotenv/config";
import express from "express";
import cors from "cors";
import { PayOS } from "@payos/node";

const app = express();

app.use(cors());
app.use(express.json());

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

app.get("/", (req, res) => {
  res.send("PayOS backend running OK");
});

app.post("/create-payment", async (req, res) => {
  try {
    const {
      productName = "Sản phẩm",
      quantity = 1,
      amount = 1000
    } = req.body;

    const orderCode = Number(Date.now().toString().slice(-6));

    const paymentLink = await payOS.paymentRequests.create({
      orderCode,
      amount: Number(amount),
      description: "DH" + orderCode,
      returnUrl: `https://phanngoquocbao1239a6.github.io?orderCode=${orderCode}`,
      cancelUrl: `https://phanngoquocbao1239a6.github.io?cancel=true`,
      items: [
        {
          name: productName,
          quantity: Number(quantity),
          price: Number(amount)
        }
      ]
    });

    res.json({
      success: true,
      orderCode,
      description: "DH" + orderCode,
      amount: Number(amount),
      productName,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode
    });

  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post("/webhook", (req, res) => {
  try {
    const data = payOS.webhooks.verify(req.body);

    console.log("WEBHOOK PAYOS:", data);

    res.status(200).send("OK");

  } catch (error) {
    console.error("WEBHOOK ERROR:", error);

    res.status(400).send("Invalid webhook");
  }
});

app.get("/payment-status/:orderCode", async (req, res) => {
  try {
    const orderCode = Number(req.params.orderCode);

    const paymentData = await payOS.paymentRequests.get(orderCode);

    console.log("PAYMENT STATUS:", paymentData);

    if (
      paymentData.status === "PAID" ||
      paymentData.status === "paid"
    ) {
      return res.json({
        success: true,
        status: "PAID",
        orderCode
      });
    }

    return res.json({
      success: true,
      status: "PENDING",
      orderCode
    });

  } catch (error) {
    console.error("CHECK PAYMENT ERROR:", error);

    return res.json({
      success: false,
      status: "PENDING"
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
