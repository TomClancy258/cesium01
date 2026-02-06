import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
// import useUserStore from '@/store/modules/user'

// 扩展配置类型
interface CustomRequestConfig {
  showError?: boolean // 是否显示错误提示
  showLoading?: boolean // 是否显示loading
}

const request01: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000, // 建议调大一点
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request01.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // const userStore = useUserStore()

  // token 处理
  // if (userStore.token) {
  //     config.headers.Authorization = `Bearer ${userStore.token}` // 更标准的写法
  // }

  // loading 处理
  const customConfig = config as CustomRequestConfig
  if (customConfig.showLoading) {
    // 可以在这里显示 loading
    // showLoading()
  }

  return config
})

// 响应拦截器
request01.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as CustomRequestConfig

    // 隐藏 loading
    if (config.showLoading) {
      // hideLoading()
    }

    // 直接返回数据（假设后端没有包装）
    return response.data
  },
  error => {
    const config = error.config as CustomRequestConfig

    // 隐藏 loading
    if (config?.showLoading) {
      // hideLoading()
    }

    // 是否显示错误提示
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
            // useUserStore().logout()
            window.location.href = '/login'
            return Promise.reject(error) // 直接返回，不再显示提示
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
  }
)

export default request01
