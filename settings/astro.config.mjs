import react from "@astrojs/react";

export default {
  integrations: [react()],
  server: { port: 4321, host: "0.0.0.0" },
};
