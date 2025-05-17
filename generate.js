const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const QRCode = require("qrcode");
const axios = require("axios");
const VietQR = require("./backend/qr_images/vietQR");

// Tạo thư mục chứa QR nếu chưa có
const outputDir = path.join(__dirname, "qr_images");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// 📌 Hàm lấy danh sách ngân hàng từ API VietQR
async function fetchBankBINMap() {
  try {
    const response = await axios.get("https://vieclamvp.vn/api/banks/");
    const banks = response.data.data;
    const bankMap = {};
    banks.forEach((bank) => {
      bankMap[bank.code] = bank.bin;
    });
    return bankMap;
  } catch (err) {
    console.error("Lỗi khi lấy danh sách ngân hàng:", err);
    return {};
  }
}

function cleanInfo(text) {
  return text
    .normalize("NFD") // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/[^\x20-\x7E]/g, "") // loại bỏ ký tự ngoài bảng ASCII
    .trim();
}
// 📌 Hàm chính
async function generateQRCodes() {
  const bankBINMap = await fetchBankBINMap();

  const workbook = XLSX.readFile("data.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  for (const [index, row] of data.entries()) {
    const bankCode = row["BANK_CODE"];
    const bin = bankBINMap[bankCode];
    if (!bin) {
      console.warn(`⚠️ Không tìm thấy BIN cho ngân hàng: ${bankCode}`);
      continue;
    }

    const account = row["ACCOUNT_NO"].toString();
    const name = row["ACCOUNT_NAME"];
    const rawAmount = row["AMOUNT"].toString().replace(/,/g, "").trim();
    const amount = Math.round(Number(rawAmount));
    const info = cleanInfo(row["ADD_INFO"] || "");

    const vqr = new VietQR();
    vqr
      .setBeneficiaryOrganization(bin, account)
      .setTransactionAmount(amount.toString())
      .setAdditionalDataFieldTemplate(info);

    const qrString = vqr.build();
    const fileName = `${index + 1}_${bankCode}_${name.replace(/ /g, "_")}.png`;
    const filePath = path.join(outputDir, fileName);

    await QRCode.toFile(filePath, qrString, { width: 300 });
  }
}

generateQRCodes();
