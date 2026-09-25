import axios from "axios";
import crypto from "crypto";
import Order from "../models/order.js";
import {
  PHONEPE_HOST,
  buildXVerify,
  verifyCallbackXVerify,
  merchantId,
} from "../utils/phonepe.js";

const APP_BASE_URL = process.env.APP_BASE_URL;
const APP_DEEP_LINK_RETURN = process.env.APP_DEEP_LINK_RETURN;

export const initiatePayment = async (req, res) => {
  try {
    const { id } = req.params; // order id
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (orderUserId !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "Accepted") {
      return res.status(400).json({
        message: `Payment can only be started once the order is Accepted (current: ${order.status})`,
      });
    }

    const merchantTransactionId = `MT${order._id.toString().slice(-10)}${Date.now()
      .toString()
      .slice(-6)}`;

    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: order.user.toString(),
      amount: Math.round(Number(order.total) * 100),
      redirectUrl: `${APP_BASE_URL}/api/payments/redirect/${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${APP_BASE_URL}/api/payments/callback`,
      mobileNumber: order.contactNumber || undefined,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      "base64",
    );
    const xVerify = buildXVerify(base64Payload);

    const { data } = await axios.post(
      `${PHONEPE_HOST}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
      },
    );

    const redirectUrl = data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      return res
        .status(502)
        .json({ message: "PhonePe did not return a checkout URL" });
    }

    order.merchantTransactionId = merchantTransactionId;
    order.paymentStatus = "PENDING";
    await order.save({ validateBeforeSave: false });

    res.json({ success: true, redirectUrl, merchantTransactionId });
  } catch (err) {
    console.error("initiatePayment error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Failed to initiate payment" });
  }
};
export const paymentRedirect = async (req, res) => {
  const { merchantTransactionId } = req.params;
  if (APP_DEEP_LINK_RETURN) {
    return res.redirect(`${APP_DEEP_LINK_RETURN}?mtx=${merchantTransactionId}`);
  }
  res.send("Payment complete — you can return to the app.");
};

export const paymentCallback = async (req, res) => {
  try {
    const receivedXVerify = req.headers["x-verify"];
    const base64Response = req.body?.response;
    if (
      !base64Response ||
      !verifyCallbackXVerify(base64Response, receivedXVerify)
    ) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const decoded = JSON.parse(
      Buffer.from(base64Response, "base64").toString("utf8"),
    );
    const { merchantTransactionId, transactionId, code } =
      decoded.data || decoded;

    await applyPaymentResult(
      merchantTransactionId,
      code,
      transactionId,
      req.io,
    );
    res.json({ success: true });
  } catch (err) {
    console.error("paymentCallback error:", err.message);
    res.status(500).json({ message: "Callback processing failed" });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const path = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const xVerify = buildXVerify(path, true);

    const { data } = await axios.get(`${PHONEPE_HOST}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId,
      },
    });

    const code = data?.code;
    const transactionId = data?.data?.transactionId;
    const order = await applyPaymentResult(
      merchantTransactionId,
      code,
      transactionId,
      req.io,
    );

    res.json({
      success: true,
      paymentStatus: order?.paymentStatus,
      status: order?.status,
    });
  } catch (err) {
    console.error(
      "checkPaymentStatus error:",
      err?.response?.data || err.message,
    );
    res.status(500).json({ message: "Failed to check payment status" });
  }
};

async function applyPaymentResult(
  merchantTransactionId,
  code,
  transactionId,
  io,
) {
  const order = await Order.findOne({ merchantTransactionId });
  if (!order) return null;

  if (code === "PAYMENT_SUCCESS" && order.paymentStatus !== "SUCCESS") {
    order.paymentStatus = "SUCCESS";
    order.phonepeTransactionId = transactionId || null;
    order.status = "Payment Done";
    order.statusTimestamps = order.statusTimestamps || {};
    order.statusTimestamps["Payment Done"] = new Date();
    order.updatedAt = new Date();
    await order.save({ validateBeforeSave: false });

    const emitter = io || (await import("../socket.js")).getIO();
    emitter?.emit("orderStatusUpdated", {
      id: order._id.toString(),
      status: order.status,
      statusTimestamps: order.statusTimestamps,
    });
  } else if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED") {
    order.paymentStatus = "FAILED";
    await order.save({ validateBeforeSave: false });
  }

  return order;
}
