import "dotenv/config";
import express from "express";
import cors from "cors";
import PayOS from "@payos/node";

const app = express();

app.use(cors({
  origin: [
    "http://phanngoquocbao.id.vn",
    "https://phanngoquocbao.id.vn",
    "http://www.phanngoquocbao.id.vn",
    "https://www.phanngoquocbao.id.vn"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

const orders = {};

app.get("/", (req, res) => {
  res.send("PayOS backend running OK");
});

app.post("/create-payment", async (req, res) => {
  try {
    const { productName, productCode, quantity, amount } = req.body;

    if (!productName || !quantity || !amount) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin sản phẩm"
      });
    }

    const orderCode = Number(Date.now().toString().slice(-6));

    const paymentLink = await payOS.createPaymentLink({
      orderCode,
      amount: Number(amount),
      description: "DH" + orderCode,
      returnUrl: `https://phanngoquocbao.id.vn/?success=true&orderCode=${orderCode}`,
      cancelUrl: `https://phanngoquocbao.id.vn/?cancel=true`,
      items: [
        {
          name: productName,
          quantity: Number(quantity),
          price: Number(amount)
        }
      ]
    });

    orders[orderCode] = {
      status: "PENDING",
      productName,
      productCode,
      quantity,
      amount
    };

    res.json({
      success: true,
      orderCode,
      description: "DH" + orderCode,
      amount,
      productName,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode || paymentLink.checkoutUrl
    });

  } catch (error) {
    console.error("Create payment error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Lỗi tạo thanh toán PayOS"
    });
  }
});

app.post("/webhook", (req, res) => {
  try {
    const data = payOS.verifyPaymentWebhookData(req.body);

    console.log("Webhook PayOS:", data);

    if (data.orderCode) {
      if (orders[data.orderCode]) {
        orders[data.orderCode].status = "PAID";
      } else {
        orders[data.orderCode] = {
          status: "PAID"
        };
      }

      console.log("Đã thanh toán:", data.orderCode);
    }

    res.status(200).send("OK");

  } catch (error) {
    console.error("Webhook error:", error);

    res.status(400).send("Invalid webhook");
  }
});

app.get("/payment-status/:orderCode", (req, res) => {
  const order = orders[req.params.orderCode];

  if (!order) {
    return res.json({
      status: "PENDING"
    });
  }

  res.json({
    status: order.status,
    productName: order.productName,
    amount: order.amount
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
