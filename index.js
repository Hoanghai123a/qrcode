const fs = require("fs");
const QRCode = require("qrcode");
const VietQR = require("./vietQR"); // Import class từ file của bạn

const vietQR = new VietQR();

// Thay đổi thông tin bên dưới theo tài khoản bạn muốn
vietQR
  .setBeneficiaryOrganization("970422", "1234567890") // Mã ngân hàng + số tài khoản
  .setTransactionAmount("100000") // Số tiền
  .setAdditionalDataFieldTemplate("Thanh toan don hang 123");

// Tạo chuỗi QR theo chuẩn VietQR
const qrData = vietQR.build();
console.log("QR String:", qrData);

// Sinh ảnh QR từ chuỗi
QRCode.toFile(
  "vietqr.png",
  qrData,
  {
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    width: 300,
  },
  function (err) {
    if (err) throw err;
    console.log("✅ QR image saved as vietqr.png");
  }
);
