import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true,
});

const csrfClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true,
});

let csrfToken = null;
let csrfRequest = null;
const unsafeMethods = new Set(["post", "put", "patch", "delete"]);
const requiresCsrf = (config) => {
  const method = String(config.method || "get").toLowerCase();
  const url = String(config.url || "");
  return unsafeMethods.has(method) && (
    url === "/api/auth/logout"
    || (url.startsWith("/api/parking/") && !url.startsWith("/api/parking/session/"))
  );
};

const loadCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = csrfClient.get("/api/auth/csrf")
      .then((response) => response.data.csrfToken)
      .finally(() => { csrfRequest = null; });
  }
  csrfToken = await csrfRequest;
  return csrfToken;
};

api.interceptors.request.use(async (config) => {
  if (requiresCsrf(config)) {
    config.headers.set("X-CSRF-Token", await loadCsrfToken());
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.csrfToken) csrfToken = response.data.csrfToken;
    return response;
  },
  async (error) => {
    const config = error.config;
    if (error.response?.data?.code === "CSRF_INVALID" && config && !config._csrfRetried) {
      config._csrfRetried = true;
      csrfToken = null;
      config.headers.set("X-CSRF-Token", await loadCsrfToken());
      return api(config);
    }
    return Promise.reject(error);
  },
);

export default api;
