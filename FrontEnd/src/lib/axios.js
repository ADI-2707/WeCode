import axios from 'axios'

const axiosInstance = axios.creat({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true // by adding this field browser will send the cookies to server automatically, on every single request
})

export default axiosInstance;