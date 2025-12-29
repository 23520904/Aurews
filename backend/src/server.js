import { createApp } from "./app.js";
import { connectDB } from "./lib/db.js";
import os from "os";

const PORT = process.env.PORT || 6666;
const app = createApp();

app.listen(PORT, () => {
  connectDB();

  // LOGIC TÌM IP LAN
  const networks = os.networkInterfaces();
  let myIP = "localhost";

  for (const name of Object.keys(networks)) {
    for (const net of networks[name]) {
      // Tìm IPv4 và không phải internal (127.0.0.1)
      if (net.family === "IPv4" && !net.internal) {
        myIP = net.address;
        break;
      }
    }
  }

  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`🏠 Local:   http://localhost:${PORT}`);
  console.log(
    `🌐 Network: http://${myIP}:${PORT}  <-- DÙNG IP NÀY CHO EXPO APP\n`
  );
});
