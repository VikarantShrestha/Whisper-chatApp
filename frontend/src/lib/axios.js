import axios from "axios";


const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE=== "development" ? "http://localhost:5002/api" : "/api",
    withCredentials: true //sending cookies on each request
});

export default axiosInstance