const { networkInterfaces } = require("os");

const nets = networkInterfaces();
const results = {
  Ethernet: [],
  WiFi: []
};

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
    if (net.family === familyV4Value && !net.internal) {
      if (name.toLowerCase().includes('eth') || name.toLowerCase().includes('en')) {
        // If interface name includes 'eth' or 'en', it's considered Ethernet
        results.Ethernet.push(net.address);
      } else if (name.toLowerCase().includes('wlan') || name.toLowerCase().includes('wifi')) {
        // If interface name includes 'wlan' or 'wifi', it's considered WiFi
        results.WiFi.push(net.address);
      }
    }
  }
}

module.exports = results;

