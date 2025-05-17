import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function QRGenerator() {
  const [activeTab, setActiveTab] = useState("bulk");
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    BANK_CODE: "",
    ACCOUNT_NO: "",
    ACCOUNT_NAME: "",
    AMOUNT: "",
    ADD_INFO: "",
  });
  const [qrImage, setQrImage] = useState(null);
  const [qrData, setQrData] = useState(null);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const form = new FormData();
    form.append("excel", file);

    try {
      const res = await axios.post(`${API_URL}/generate-bulk`, form, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "qr_codes.zip");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("❌ Lỗi tải file zip:", error);
      alert("Tạo QR hàng loạt thất bại.");
    }
  };

  const handleGenerateOne = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_URL}/generate-one`, formData);
      setQrImage(res.data.qrImage);
      setQrData(res.data.qrData);
    } catch (error) {
      console.error("❌ Lỗi tạo mã QR:", error);
      alert("Tạo mã QR thất bại.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
          Trình tạo mã QR VietQR
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-6 space-x-4">
          <button
            className={`px-5 py-2 rounded font-medium ${
              activeTab === "bulk"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("bulk");
              setQrImage(null);
              setQrData(null);
            }}
          >
            Tạo hàng loạt
          </button>
          <button
            className={`px-5 py-2 rounded font-medium ${
              activeTab === "single"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("single");
              setQrImage(null);
              setQrData(null);
            }}
          >
            Tạo thủ công
          </button>
        </div>

        {/* Tab: Bulk */}
        {activeTab === "bulk" && (
          <form onSubmit={handleFileUpload} className="space-y-4 text-center">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="block mx-auto text-sm"
            />
            <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow">
              Tải xuống ZIP mã QR
            </button>
          </form>
        )}

        {/* Tab: Single */}
        {activeTab === "single" && (
          <form onSubmit={handleGenerateOne} className="space-y-4">
            {Object.keys(formData).map((key) => (
              <input
                key={key}
                type="text"
                placeholder={key}
                value={formData[key]}
                onChange={(e) =>
                  setFormData({ ...formData, [key]: e.target.value })
                }
                required={key !== "ADD_INFO"}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
              />
            ))}
            <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow">
              Tạo mã QR
            </button>
          </form>
        )}

        {/* Hiển thị QR sau khi tạo */}
        {qrImage && (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Mã QR được tạo:
            </h2>
            <img
              src={qrImage}
              alt="QR Code"
              className="mx-auto w-48 h-48 mb-4 border rounded shadow"
            />
            <pre className="bg-gray-100 p-4 rounded text-sm text-left overflow-auto max-h-64">
              {JSON.stringify(qrData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
