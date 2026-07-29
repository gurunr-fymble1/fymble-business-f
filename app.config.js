export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      // backendUrl: "https://erminia-mirthful-nonpatriotically.ngrok-free.dev",
      // backendUrl: "https://fbd6-27-7-26-99.ngrok-free.app",
      // backendUrl: "https://app.fittbot.com",
      backendUrl: "https://unitalicized-nonexotic-see.ngrok-free.dev",
      // backendUrl: "https://georgie-basal-kala.ngrok-free.dev",
      // backendUrl: "https://staging.fittbot.com",

      backendPort: "8000",
      eas: {
        projectId: "ba5670ac-efd7-4f6b-a538-2db185d42d8f",
      },
    },
  };
};
