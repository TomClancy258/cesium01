import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
// import useUserStore from '@/store/modules/user'

interface CustomRequestConfig {
  showError?: boolean
  showLoading?: boolean
}

interface CreateRequestOptions {
  timeout?: number
}

function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // const userStore = useUserStore()
    // if (userStore.token) {
    //   config.headers.Authorization = `Bearer ${userStore.token}`
    // }

    const customConfig = config as CustomRequestConfig
    if (customConfig.showLoading) {
      // showLoading()
    }

    return config
  })

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config as CustomRequestConfig

      if (config.showLoading) {
        // hideLoading()
      }

      return response.data
    },
    error => {
      const config = error.config as CustomRequestConfig

      if (config?.showLoading) {
        // hideLoading()
      }

      if (config?.showError !== false) {
        let message = '网络错误'

        if (error.response) {
          const status = error.response.status
          switch (status) {
            case 400:
              message = '请求参数错误'
              break
            case 401:
              message = '登录已过期，请重新登录'
              window.location.href = '/login'
              return Promise.reject(error)
            case 403:
              message = '没有权限访问'
              break
            case 404:
              message = '请求地址错误'
              break
            case 500:
              message = '服务器内部错误'
              break
            case 502:
            case 503:
            case 504:
              message = '服务器暂时不可用'
              break
            default:
              message = `请求失败 (${status})`
          }
        } else if (error.request) {
          message = '网络请求超时，请检查网络连接'
        } else {
          message = error.message || '请求配置错误'
        }

        ElMessage({
          type: 'error',
          message,
          duration: 3000,
        })
      }

      return Promise.reject(error)
    },
  )
}

export function createRequest(
  baseURL: string,
  options: CreateRequestOptions = {},
): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: options.timeout ?? 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  setupInterceptors(instance)
  return instance
}

/** 飞行/机场/卫星等业务数据（vite proxy → 8087） */
export const flyDataRequest = createRequest(import.meta.env.VITE_APP_BASE_API)

/** 管控区等 GeoJSON 静态数据（vite proxy → 8084） */
export const geojsonRequest = createRequest('/geojson')

/** 地图瓦片等资源（vite proxy → 8085） */
export const mapRequest = createRequest('/map')

/** 三维模型资源（vite proxy → 8086） */
export const modelRequest = createRequest('/model')

export default flyDataRequest
