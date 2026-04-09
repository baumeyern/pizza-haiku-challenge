import QRCode from "qrcode";

export default async function QRPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const qrDataUrl = await QRCode.toDataURL(siteUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
        🍕 Pizza Haiku Challenge 🍕
      </h1>
      <p className="text-gray-300 mb-8 text-lg">Scan to play!</p>

      <div className="bg-white rounded-3xl p-6 shadow-2xl">
        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 md:w-80 md:h-80" />
      </div>

      <p className="text-gray-400 mt-6 text-lg font-mono">{siteUrl}</p>
    </main>
  );
}
