import Request from '../utils/request'
import { GAME_CONFIG } from '../config/constants'

// 内部API基础URL（不对外暴露）
const API_BASE_URL = 'https://mzsdkapi.higame.cn/api/v2'

// H5登录接口
export const hupuH5Login = async (accessToken, config = {}) => {
  if (!accessToken) {
    throw new Error('accessToken 不能为空')
  }

  try {
    const gameConfig = config.gameConfig || GAME_CONFIG
    const request = new Request(API_BASE_URL)
    
    const response = await request.post('/login/otherHupuH5Login', {
      accessToken: accessToken,
      gameId: gameConfig.GAME_ID,
      gameKey: gameConfig.GAME_KEY,
      gameVersion: gameConfig.GAME_VERSION,
      sdkVersion: gameConfig.SDK_VERSION,
      deviceName: 'H5'
    })

    // 修改：检查 response.success
    if (response.success) {
      // 确保 token 被正确保存
      if (response.data?.token) {
        localStorage.setItem('hupu_token', response.data.token)
        console.log('✅ Token 已保存')
      }
      return response.data || response
    } else {
      // 清除可能的无效 token
      localStorage.removeItem('hupu_token')
      throw new Error(response.message || `登录失败，错误码: ${response.code}`)
    }
  } catch (error) {
    console.error('H5登录失败:', error)
    throw error
  }
}

// 确认角色接口
export const confirmRole = async (roleData = {}, config = {}) => {
  try {
    const gameConfig = config.gameConfig || GAME_CONFIG
    const request = new Request(API_BASE_URL)
    
    const response = await request.post('/user/chooseRole', {
      gameId: gameConfig.GAME_ID, // 确保传递 gameId
      gameKey: gameConfig.GAME_KEY,
      gameVersion: gameConfig.GAME_VERSION,
      sdkVersion: gameConfig.SDK_VERSION,
      deviceName: 'H5',
      serverId: 'server_1', // 使用实际值
      roleId: 'test_role_123', 
      roleName: '测试角色',
      level: '1',
      vip: '0',
      ...roleData
    })

    // 修改：检查 response.success
    if (response.success) {
      return response.data
    } else {
      throw new Error(response.message || `确认角色失败，错误码: ${response.code}`)
    }
  } catch (error) {
    console.error('确认角色失败:', error)
    throw error
  }
}

// 获取商品信息
export const getProductInfo = async (productData = {}, config = {}) => {
  try {
    const gameConfig = config.gameConfig || GAME_CONFIG
    const request = new Request(API_BASE_URL)
    
    const response = await request.post('/order/getProductInfo', {
      gameId: gameConfig.GAME_ID,
      gameKey: gameConfig.GAME_KEY,
      gameVersion: gameConfig.GAME_VERSION,
      sdkVersion: gameConfig.SDK_VERSION,
      deviceName: 'H5',
      sku: productData.sku || '1',
      roleId: productData.roleId || 'test_role_123', 
      serverId: productData.serverId || 'server_1',
      ...productData
    })

    // 修改：检查 response.success
    if (response.success) {
      return response.data
    } else {
      throw new Error(response.message || `获取商品信息失败，错误码: ${response.code}`)
    }
  } catch (error) {
    console.error('获取商品信息失败:', error)
    throw error
  }
}