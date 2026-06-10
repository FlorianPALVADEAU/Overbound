import axios from 'axios'

const resolveBaseURL = () => {
  // In the browser, keep API calls same-origin to preserve auth cookies.
  if (typeof window !== 'undefined') {
    return '/api'
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL
}

const axiosClient = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
})

export default axiosClient
