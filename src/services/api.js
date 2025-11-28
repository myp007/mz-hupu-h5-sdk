import Request from '../utils/request'
import { GAME_CONFIG } from '../config/constants'

// 内部API基础URL（不对外暴露）
const API_BASE_URL = 'https://mzsdkapi.higame.cn/api/v2'

// 虎扑H5登录接口
export const hupuH5Login = async (accessToken, config = {}) => {
  if (!accessToken) {
    throw new Error('accessToken 不能为空')
  }

  try {
    const deviceName = 'H5'
    const gameConfig = config.gameConfig || GAME_CONFIG
    const request = new Request(API_BASE_URL)
    
    const response = await request.post('/login/otherHupuH5Login', {
      accessToken: accessToken,
      gameId: gameConfig.GAME_ID, // 使用统一的游戏ID
      gameKey: gameConfig.GAME_KEY,
      gameVersion: gameConfig.GAME_VERSION,
      sdkVersion: gameConfig.SDK_VERSION,
      deviceName: deviceName
    })

    if (response.success) {
      return response.data || response
    } else {
      throw new Error(response.message || '登录失败')
    }
  } catch (error) {
    console.error('虎扑H5登录失败:', error)
    throw error
  }
}

// 确认角色接口
export const confirmRole = async (roleData = {}, config = {}) => {
  try {
    const request = new Request(API_BASE_URL)
    const response = await request.post('/user/chooseRole', {
      serverId: '123',
      roleId: '123', 
      level: '1',
      vip: '99',
      nickName: 'test',
      serverName: 'test123',
      ...roleData
    })

    if (response.success) {
      return response.data
    } else {
      throw new Error(response.message || '确认角色失败')
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
      sku: '1',
      roleId: '1231', 
      serverId: '1231',
      gameId: gameConfig.GAME_ID,
      ...productData
    })

    if (response.success) {
      return response.data
    } else {
      throw new Error(response.message || '获取商品信息失败')
    }
  } catch (error) {
    console.error('获取商品信息失败:', error)
    throw error
  }
}