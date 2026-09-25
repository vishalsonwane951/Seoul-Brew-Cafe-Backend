import crypto from "crypto";

const {
  PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_KEY,
  PHONEPE_SALT_INDEX = "1",
  PHONEPE_ENV = "sandbox",
} = process.env;

export const PHONEPE_HOST =
  PHONEPE_ENV === "prod"
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

export const buildXVerify = (payloadOrPath, isStatusCheck = false) => {
  const stringToHash = isStatusCheck
    ? `${payloadOrPath}${PHONEPE_SALT_KEY}`
    : `${payloadOrPath}/pg/v1/pay${PHONEPE_SALT_KEY}`;
  const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
  return `${sha256}###${PHONEPE_SALT_INDEX}`;
};

export const verifyCallbackXVerify = (base64Response, receivedXVerify) => {
  const expected =
    crypto
      .createHash("sha256")
      .update(base64Response + PHONEPE_SALT_KEY)
      .digest("hex") + `###${PHONEPE_SALT_INDEX}`;
  return expected === receivedXVerify;
};

export const merchantId = PHONEPE_MERCHANT_ID;
