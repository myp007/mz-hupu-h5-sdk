import { useState, createContext, useContext, useEffect, useMemo } from 'react'
import { hupuH5Login, getProductInfo, confirmRole } from '../services/api'
import { GAME_CONFIG } from '../config/constants'

// 创建Context
const HupuSDKContext = createContext()

// 默认配置（内部使用，不对外暴露）
const INTERNAL_CONFIG = {
  apiBaseURL: 'https://mzsdkapi.higame.cn/api/v2',
  autoLogin: true,
  sdkScriptURL: 'https://w1.hoopchina.com.cn/gamecenter/hupu-game-common-sdk.min.js'
}

// 自定义Hook
export const useHupuSDK = () => {
  const context = useContext(HupuSDKContext)
  if (!context) {
    throw new Error('useHupuSDK must be used within HupuSDKProvider')
  }
  return context
}

// 开发环境模拟SDK - 只在开发时使用
const createDevMockSDK = (gameConfig) => {
  console.log('🎭 开发环境: 使用模拟SDK进行测试')
  return {
    version: gameConfig?.SDK_VERSION || '6.1.0',

    // 模拟 getAccessToken - 返回文档格式
    getAccessToken: () => Promise.resolve({
      code: "SUCCESS",
      message: "操作成功",
      data: {
        access_token: 'mock_token_' + Date.now()
      }
    }),

    // 模拟 report - 文档说无返回
    report: (data) => {
      console.log('📊 开发环境 - 角色日志上报:', data)
      // 文档说返回结果：无
      return undefined
    },

    // 模拟其他可能用到的方法
    getUserDetail: () => Promise.resolve({
      userId: 'dev_user_' + Math.random().toString(36).substr(2, 9),
      nickname: '开发测试用户',
      avatar: '',
      level: 1
    }),

    getBalance: () => Promise.resolve({
      balance: 1000,
      currency: '积分'
    }),

    // 其他方法
    debug: () => Promise.resolve({ mode: 'development' }),
    reCharge: () => Promise.resolve({ success: true }),
    goToRecharge: () => Promise.resolve({}),
    getIdVerify: () => Promise.resolve({ verified: true }),
    openLandscapeMode: () => Promise.resolve({}),
    closeLandscapeMode: () => Promise.resolve({}),
    configFullScreenMenu: () => Promise.resolve({ success: true }),
    setData: () => Promise.resolve({ success: true }),
    getData: () => Promise.resolve({ data: 'dev_mock_data' }),
    post: () => Promise.resolve({ success: true }),
  }
}

// 动态加载SDK
const loadHupuSDK = (sdkScriptURL) => {
  return new Promise((resolve, reject) => {
    if (window.HupuGameSdk) {
      resolve(window.HupuGameSdk)
      return
    }

    const script = document.createElement('script')
    script.src = sdkScriptURL || 'https://w1.hoopchina.com.cn/gamecenter/hupu-game-common-sdk.min.js'
    script.onload = () => {
      console.log('✅ SDK脚本加载完成')
      setTimeout(() => {
        if (window.HupuGameSdk) {
          console.log('✅ SDK全局对象已找到==', window.HupuGameSdk)
          resolve(window.HupuGameSdk)
        } else {
          reject(new Error('SDK加载后未找到全局对象'))
        }
      }, 100)
    }
    script.onerror = () => {
      console.warn('❌ SDK脚本加载失败')
      reject(new Error('SDK加载失败'))
    }

    document.head.appendChild(script)
  })
}

// SDK Provider组件
export const HupuSDKProvider = ({ 
  children, 
  config = {} 
}) => {
  // 合并配置（只支持 gameConfig）
  const mergedConfig = useMemo(() => ({
    ...INTERNAL_CONFIG,
    gameConfig: {
      ...GAME_CONFIG,
      ...(config.gameConfig || {})
    }
  }), [config])
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkInstance, setSdkInstance] = useState(null)
  const [isInHupuApp, setIsInHupuApp] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)
  const [isAllowedDomain, setIsAllowedDomain] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [hupuUserInfo, setHupuUserInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoLogin, setAutoLogin] = useState(INTERNAL_CONFIG.autoLogin)

  // 检测环境 - 修正版
  const checkEnvironment = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const currentHostname = window.location.hostname
    const currentOrigin = window.location.origin

    // 1. 检测是否在虎扑App内
    const isInHupuApp = /hupu|hoopchina/i.test(userAgent) || window.self !== window.top

    // 2. 检测是否在允许的域名下（虎扑白名单域名）
    const allowedDomains = [
      'mzsdkapi.higame.cn',
      // 可以添加其他虎扑允许的域名
    ]
    const isAllowedDomain = allowedDomains.some(domain =>
      currentHostname === domain || currentHostname.endsWith('.' + domain)
    )

    // 3. 检测是否是开发环境
    const isDevelopment = process.env.NODE_ENV === 'development' ||
      currentHostname === 'localhost' ||
      currentHostname === '127.0.0.1'

    console.log('🔍 环境检测:', {
      userAgent,
      isInHupuApp,
      isAllowedDomain,
      isDevelopment,
      currentHostname,
      currentOrigin
    })

    return {
      isInHupuApp,
      isAllowedDomain,
      isDevMode: isDevelopment && !isInHupuApp
    }
  }

  // 安全的方法调用封装
  const safeCall = async (methodName, params = {}) => {
    if (!sdkReady || !sdkInstance) {
      console.warn(`⚠️ 调用 ${methodName} 失败: SDK未就绪`)
      return null
    }

    if (typeof sdkInstance[methodName] !== 'function') {
      console.error(`❌ 方法 ${methodName} 不存在于SDK实例中`)
      return null
    }

    try {
      console.log(`📞 调用SDK方法: ${methodName}`, params)
      const result = await sdkInstance[methodName](params)
      console.log(`✅ ${methodName} 调用成功:`, result)
      return result
    } catch (error) {
      console.error(`❌ 调用 ${methodName} 失败:`, error)
      return null
    }
  }

  // 在登录方法中保存 token
  const loginWithHupu = async () => {
    if (loading) {
      console.log('⏳ 登录进行中，跳过重复请求')
      return null
    }

    setLoading(true)
    try {
      // 获取access_token
      const tokenResult = await safeCall('getAccessToken')

      // 处理不同的返回格式
      let accessToken
      if (tokenResult && tokenResult.code === "SUCCESS" && tokenResult.data?.access_token) {
        // 文档格式: {code, message, data: {access_token}}
        accessToken = tokenResult.data.access_token
      } else if (tokenResult && tokenResult.access_token) {
        // 可能的标准格式: {access_token}
        accessToken = tokenResult.access_token
      } else {
        throw new Error(tokenResult?.message || '获取access_token失败')
      }

      console.log('🔑 获取到access_token:', accessToken)

      // 调用后端登录接口
      console.log('🚀 调用后端登录接口...')
      const loginResult = await hupuH5Login(accessToken, mergedConfig)
      console.log('登录信息==',loginResult)
      // 保存token到localStorage
      if (loginResult?.token) {
        localStorage.setItem('hupu_token', loginResult.token)

      }
      // 保存用户信息和token
      setUserInfo(loginResult)
      console.log('✅ 虎扑H5登录成功:', loginResult)

      return loginResult
    } catch (error) {
      console.error('❌ 虎扑H5登录失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }
  // 确认角色
  const confirmRoleAction = async (roleData = {}) => {
    try {
      console.log('🎮 确认角色信息...')
      const result = await confirmRole(roleData, mergedConfig)
      console.log('✅ 角色确认成功:', result)
      return result
    } catch (error) {
      console.error('❌ 角色确认失败:', error)
      throw error
    }
  }
  // 获取虎扑用户详细信息
  const getHupuUserDetail = async () => {
    try {
      console.log('👤 获取虎扑用户详细信息...')
      const userDetail = await safeCall('getUserDetail')
      let userInfo = userDetail.data
      console.log('用户信息==',JSON.stringify(userInfo) )
      if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo) )
        setHupuUserInfo(userInfo)
        console.log('✅ 获取虎扑用户信息成功:', userInfo)
      }
      return userInfo
    } catch (error) {
      console.error('❌ 获取虎扑用户信息失败:', error)
      return null
    }
  }

  // 角色日志上报
  const reportRole = async (roleData) => {
    try {
      console.log('📝 上报角色日志:', roleData)

      // 验证必要参数
      const { serverId, roleId, roleName, createRoleTime } = roleData
      if (!serverId || !roleId || !roleName || !createRoleTime) {
        throw new Error('缺少必要的角色信息参数')
      }

      await safeCall('report', roleData)
      console.log('✅ 角色日志上报成功')

      return { success: true }
    } catch (error) {
      console.error('❌ 角色日志上报失败:', error)
      throw error
    }
  }

  // 自动登录
  const performAutoLogin = async () => {
    if (!autoLogin || !isInHupuApp || userInfo) {
      return
    }

    try {
      console.log('🔄 开始自动登录...')
      const loginResult = await loginWithHupu()

      // 登录成功后自动获取用户详细信息
      if (loginResult) {
        await getHupuUserDetail()
      }
    } catch (error) {
      console.warn('⚠️ 自动登录失败，用户可能需要手动登录:', error)
    }
  }

  // 组合方法：获取token并立即登录
  const getTokenAndLogin = async () => {
    const tokenResult = await safeCall('getAccessToken')
    if (tokenResult) {
      const loginResult = await loginWithHupu()
      // 登录成功后获取用户详细信息
      if (loginResult) {
        await getHupuUserDetail()
      }
      return loginResult
    }
    return null
  }
// 获取商品信息
const getProductInfoAction = async (productData = {}) => {
  try {
    console.log('🛍️ 获取商品信息...', productData)
    const result = await getProductInfo(productData, mergedConfig)
    console.log('✅ 获取商品信息成功:', result)
    return result
  } catch (error) {
    console.error('❌ 获取商品信息失败:', error)
    throw error
  }
}

// 调用SDK充值接口
const recharge = async (rechargeData) => {
  try {
    console.log('💰 调用SDK充值接口...', rechargeData)
    
    if (!sdkInstance?.reCharge) {
      throw new Error('充值功能不可用')
    }

    const result = await safeCall('reCharge', rechargeData)
    console.log('✅ SDK充值调用成功:', result)
    return result
  } catch (error) {
    console.error('❌ SDK充值调用失败:', error)
    throw error
  }
}
// 获取用户余额
const getBalance = async () => {
  try {
    console.log('💰 获取用户余额...')
    const balanceResult = await safeCall('getBalance')
    
    if (balanceResult && balanceResult.code === "SUCCESS" && balanceResult.data?.balance) {
      const balance = parseInt(balanceResult.data.balance)
      console.log('✅ 获取用户余额成功:', balance)
      return balance
    } else {
      throw new Error(balanceResult?.message || '获取余额失败')
    }
  } catch (error) {
    console.error('❌ 获取用户余额失败:', error)
    throw error
  }
}
// 完整的购买流程
const purchaseProduct = async (productParams = {}, onSuccess) => {
  try {
    console.log('🚀 开始购买流程...')
    
    // 1. 获取商品信息
    const productInfo = await getProductInfoAction(productParams)
    console.log('📦 商品信息:', productInfo)
    
    // 2. 准备充值参数 - 使用商品的实际价格
    const rechargeParams = {
      amount: parseFloat(productInfo.amount) * 10, // amount 乘10
      extInfo: {
        other: Date.now().toString(),
        orderId:productParams.cp_order || 'sdk_test1763985530503',
        self: {
          game_id: mergedConfig.gameConfig.GAME_ID, // 使用统一的游戏ID
          cp_order: productParams.cp_order || 'sdk_test1763985530503',
          sku: productParams.sku || '1',
          server_id: productParams.serverId || '1'
        }
      }
    }
    
    console.log('💳 充值参数:', rechargeParams)
    
    // 3. 调用SDK充值
    const rechargeResult = await recharge(rechargeParams)
    console.log('🎉 购买流程完成:', rechargeResult)
    
    // 4. 购买成功后回调，用于刷新余额
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess()
    }
    
    return rechargeResult
  } catch (error) {
    console.error('❌ 购买流程失败:', error)
    throw error
  }
}
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        console.log('🚀 开始初始化SDK...')

        const { isInHupuApp, isAllowedDomain, isDevMode } = checkEnvironment()
        setIsInHupuApp(isInHupuApp)
        setIsAllowedDomain(isAllowedDomain)
        setIsDevMode(isDevMode)

        let instance = null

        // 在虎扑App内 或 在允许的域名下 才加载真实SDK
        if (isInHupuApp || isAllowedDomain) {
          // 虎扑环境或允许域名：加载真实SDK
          try {
            instance = await loadHupuSDK(INTERNAL_CONFIG.sdkScriptURL)
            console.log('✅ 真实SDK加载成功 - 使用生产环境方法')
            window.HupuGameSdk && console.log('📦 SDK版本:', window.HupuGameSdk.version || '未知版本')

            // 测试获取token（可选）
            if (window.HupuGameSdk) {
              window.HupuGameSdk.getAccessToken().then(token => {
                console.log('直接获取token结果==', token)
              }).catch(err => {
                console.error('直接获取token失败==', err)
              })
            }
          } catch (error) {
            console.error('❌ 真实SDK加载失败:', error)
            // 如果SDK加载失败，在开发模式下使用模拟SDK
            if (isDevMode) {
              console.log('🔄 开发模式下使用模拟SDK')
              instance = createDevMockSDK(mergedConfig.gameConfig)
            } else {
              setSdkReady(true)
              return
            }
          }
        } else if (isDevMode) {
          // 开发环境：使用模拟SDK
          console.log('🌐 开发环境 - 使用模拟SDK进行测试')
          instance = createDevMockSDK(mergedConfig.gameConfig)
        } else {
          // 其他环境：不提供SDK功能
          console.log('⚠️ 非虎扑环境且非允许域名 - SDK功能不可用')
          setSdkReady(true)
          return
        }

        setSdkInstance(instance)
        setSdkReady(true)
        console.log('🎉 SDK初始化完成')

      } catch (error) {
        console.error('❌ SDK初始化失败:', error)
        setSdkReady(true)
      }
    }

    initializeSDK()
  }, [])

  // SDK就绪后自动登录（只在虎扑环境中）
  useEffect(() => {
    if (sdkReady && isInHupuApp && sdkInstance) {
      performAutoLogin()
    }
  }, [sdkReady, isInHupuApp, sdkInstance])

  const value = {
    sdkReady,
    sdkInstance,
    isInHupuApp,
    isDevMode,
    isAllowedDomain,
    userInfo,
    hupuUserInfo,
    loading,
    autoLogin,
    config: {
      gameConfig: mergedConfig.gameConfig
    },

    // 登录相关
    loginWithHupu,
    setAutoLogin,
    getTokenAndLogin,

    // 用户信息相关
    getHupuUserDetail,

    // 角色上报
    reportRole,
    confirmRole: confirmRoleAction,
    getBalance,
    // 内购相关
    getProductInfo: getProductInfoAction,
    recharge,
    purchaseProduct,

    // SDK原生方法
    getAccessToken: () => safeCall('getAccessToken'),
    getUserDetail: () => safeCall('getUserDetail'),
    debug: () => safeCall('debug'),
    reCharge: (params) => safeCall('reCharge', params),
    goToRecharge: () => safeCall('goToRecharge'),
    getIdVerify: () => safeCall('getIdVerify'),
    openLandscapeMode: () => safeCall('openLandscapeMode'),
    closeLandscapeMode: () => safeCall('closeLandscapeMode'),
    configFullScreenMenu: (config) => safeCall('configFullScreenMenu', config),
    setData: (data) => safeCall('setData', data),
    getData: () => safeCall('getData'),
    post: (data) => safeCall('post', data),
  }

  return (
    <HupuSDKContext.Provider value={value}>
      {children}
    </HupuSDKContext.Provider>
  )
}