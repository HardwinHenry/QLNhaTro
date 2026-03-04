import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const accessToken = sessionStorage.getItem("accessToken");
        if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes('/auth/refresh')) {
                return Promise.reject(error);
            }
            originalRequest._retry = true;

            try {
                const refreshToken = sessionStorage.getItem("refreshToken");
                if (!refreshToken || refreshToken === "null" || refreshToken === "undefined") {
                    throw new Error("No refresh token");
                }

                const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;
                sessionStorage.setItem("accessToken", accessToken);

                // Update axios default header and retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh token expired or invalid, logout user
                sessionStorage.removeItem("user");
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("refreshToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
