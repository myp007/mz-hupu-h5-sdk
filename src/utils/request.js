import { GAME_CONFIG } from '../config/constants'
class Request {
  constructor(baseURL = '') {
    this.baseURL = baseURL
    this.timeout = 10000
  }

  // 获取固定参数
  getFixedParams() {
    return {
      gameKey: GAME_CONFIG.GAME_KEY,
      gameVersion: GAME_CONFIG.GAME_VERSION,
      sdkVersion: GAME_CONFIG.SDK_VERSION,
      deviceName: 'H5'
    }
  }

  // 获取token
  getToken() {
    return localStorage.getItem('hupu_token')
  }

  // 处理请求参数
  processParams(params = {}) {
    const fixedParams = this.getFixedParams()
    const token = this.getToken()
    
    return {
      ...fixedParams,
      ...params,
      ...(token ? { token } : {})
    }
  }

  // 处理响应数据
  handleResponse(data, url) {
  console.log(`📨 响应数据: ${url}`, data)
  
  // 修改：根据实际业务码判断成功
  // 假设业务成功码是 1，但需要查看实际接口文档
  const successCodes = [1, 1000, 0] // 可能的成功码
  
  if (successCodes.includes(data.code)) {
    return {
      success: true,
      data: data.data,
      message: data.msg || '请求成功',
      code: data.code
    }
  } else {
    // 重要：返回完整的错误信息，不直接抛出
    return {
      success: false,
      message: data.msg || `请求失败，错误码: ${data.code}`,
      code: data.code,
      data: data.data || null
    }
  }
}

  // 通用请求方法
  async request(url, options = {}) {
    // 处理请求体
    let body = options.body
    if (body && typeof body === 'object') {
        body = JSON.stringify(this.processParams(body))
    }

    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: this.timeout,
      ...options,
      body: body
    }

    const fullURL = this.baseURL + url

    try {
      console.log(`🚀 发起请求: ${config.method} ${fullURL}`, body ? JSON.parse(body) : '')
      
      const response = await fetch(fullURL, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return this.handleResponse(data, fullURL)
      
    } catch (error) {
      console.error(`❌ 请求失败: ${fullURL}`, error)
      throw error
    }
  }

  // GET 请求
  get(url, params = {}, options = {}) {
    let queryString = ''
    const processedParams = this.processParams(params)
    if (Object.keys(processedParams).length > 0) {
      queryString = '?' + new URLSearchParams(processedParams).toString()
    }
    return this.request(url + queryString, { method: 'GET', ...options })
  }

  // POST 请求
  post(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: data,
      ...options
    })
  }

  // PUT 请求
  put(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body: data,
      ...options
    })
  }

  // DELETE 请求
  delete(url, options = {}) {
    return this.request(url, { method: 'DELETE', ...options })
  }
}

// 创建API请求实例
export const hupuRequest = new Request('https://mzsdkapi.higame.cn/api/v2')

export default Request