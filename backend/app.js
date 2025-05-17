const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const QRCode = require("qrcode");
const AdmZip = require("adm-zip");
const VietQR = require("./vietQR");
const cors = require("cors");

const app = express();
app.use(cors()); // Cho phép frontend gọi từ localhost:5173
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cho phép truy cập ảnh QR từ trình duyệt
app.use("/qr_images", express.static(path.join(__dirname, "qr_images")));

const upload = multer({ dest: path.join(__dirname, "../uploads") });

// Bản đồ mã ngân hàng -> BIN
const BIN_MAP = {
  VCB: "970436",
  // Thêm các mã khác nếu cần
};

// Endpoint tạo mã QR đơn
app.post("/generate-one", async (req, res) => {
  try {
    const { BANK_CODE, ACCOUNT_NO, AMOUNT, ADD_INFO } = req.body;
    const bin = BIN_MAP[BANK_CODE] || "970436";

    const qr = new VietQR()
      .setBeneficiaryOrganization(bin, ACCOUNT_NO)
      .setTransactionAmount(AMOUNT)
      .setAdditionalDataFieldTemplate(ADD_INFO || "");

    const qrString = qr.build();
    const outputPath = path.join(__dirname, "qr_images", "single.png");
    await QRCode.toFile(outputPath, qrString, { width: 300 });

    res.json({
      qrImage: `http://localhost:3001/qr_images/single.png`,
      qrData: req.body,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo mã QR đơn:", error);
    res.status(500).json({ error: "Lỗi tạo mã QR" });
  }
});

// Endpoint tạo QR hàng loạt từ file Excel
app.post("/generate-bulk", upload.single("excel"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const zip = new AdmZip();
    const outputDir = path.join(__dirname, "qr_images");

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const bin = BIN_MAP[row["BANK_CODE"]] || "970436";
      const amount = row["AMOUNT"].toString().replace(/,/g, "").trim();
      const qr = new VietQR()
        .setBeneficiaryOrganization(bin, row["ACCOUNT_NO"].toString())
        .setTransactionAmount(amount)
        .setAdditionalDataFieldTemplate(row["ADD_INFO"] || "");

      const qrString = qr.build();
      const fileName = `QR_${i + 1}.png`;
      const fullPath = path.join(outputDir, fileName);

      await QRCode.toFile(fullPath, qrString, { width: 300 });
      zip.addLocalFile(fullPath);
    }

    const zipPath = path.join(outputDir, "qr_codes.zip");
    zip.writeZip(zipPath);

    res.download(zipPath);
  } catch (error) {
    console.error("❌ Lỗi tạo QR hàng loạt:", error);
    res.status(500).send("Lỗi tạo QR hàng loạt.");
  }
});

// Khởi chạy server
app.listen(3001, () => {
  console.log("✅ Backend đang chạy tại http://localhost:3001");
});
