require("dotenv").config();

const express = require("express");
const cors = require("cors");
const PayOS = require("@payos/node");

const app = express();

app.use(cors());
app.use(express.json());

const payOS = new PayOS.default(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

let orders = {};

app.get("/", (req, res) => {
  res.send("PayOS backend running");
});

app.post("/create-payment", async (req, res) => {

  try {

    const orderCode =
      Number(Date.now().toString().slice(-6));

    const paymentLink =
      await payOS.createPaymentLink({

        orderCode,

        amount: 150000,

        description:
          "DH" + orderCode,

        returnUrl:
          "https://phanngoquocbao1239a6.github.io",

        cancelUrl:
          "https://phanngoquocbao1239a6.github.io",

        items: [
          {
            name:
              "Tai nghe Bluetooth",

            quantity: 1,

            price: 150000
          }
        ]
      });

    orders[orderCode] = "PENDING";

    res.json({
      orderCode,
      checkoutUrl:
        paymentLink.checkoutUrl
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message
    });

  }

});

app.post("/webhook", (req, res) => {

  console.log(req.body);

  res.sendStatus(200);

});

app.get(
  "/payment-status/:orderCode",
  (req, res) => {

    const status =
      orders[req.params.orderCode]
      || "PENDING";

    res.json({ status });

});

app.listen(
  process.env.PORT || 3000,
  () => {

    console.log(
      "Server running"
    );

});
