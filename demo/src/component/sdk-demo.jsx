import React from 'react'
import { HupuSDKProvider, useHupuSDK } from 'mz-h5-sdk'

// 内部组件
function SDKTestInner() {
  const {
    sdkReady,
    loading,
    userInfo,
    loginWithHupu,
    confirmRole,
    purchaseProduct,
    getBalance
  } = useHupuSDK()

  const handleLogin = async () => {
    try {
      const result = await loginWithHupu()
      console.log('登录结果:', result)
      alert(`登录成功: ${result.nickname}`)
    } catch (error) {
      console.error('登录失败:', error)
      alert('登录失败')
    }
  }

  const handlePurchase = async () => {
    try {
      // 严格按照你的 purchaseProduct 方法参数结构
      const productParams = {
        cp_order: 'sdk_test1763985530503', // 使用你代码中的默认值
        sku: '1',                          // 使用你代码中的默认值
        serverId: '1'                      // 使用你代码中的默认值
      }
      
      console.log('开始购买商品，参数:', productParams)
      const result = await purchaseProduct(productParams)
      console.log('购买结果:', result)
      alert(`购买成功！`)
    } catch (error) {
      console.error('购买失败:', error)
      alert(`购买失败: ${error.message}`)
    }
  }

  const handleGetBalance = async () => {
    try {
      const result = await getBalance()
      console.log('余额结果:', result)
      alert(`当前余额: ${result}`)
    } catch (error) {
      console.error('获取余额失败:', error)
    }
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>mz-h5-sdk 测试</h2>
      
      <div>
        <p>SDK 状态: {sdkReady ? '✅ 已就绪' : '⏳ 初始化中'}</p>
        <p>加载状态: {loading ? '🔄 加载中' : '✅ 空闲'}</p>
        <p>用户信息: {userInfo ? JSON.stringify(userInfo) : '未登录'}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={handleLogin} 
          disabled={loading} 
          style={{ marginRight: '10px', padding: '10px 16px' }}
        >
          模拟登录
        </button>
        <button 
          onClick={() => confirmRole({ 
            roleId: 'test_role_123', 
            roleName: '测试角色',
            serverId: 'server_1',
            serverName: '测试服务器',
            createRoleTime: Date.now()
          })} 
          disabled={!userInfo}
          style={{ marginRight: '10px', padding: '10px 16px' }}
        >
          确认角色
        </button>
        <button 
          onClick={handlePurchase} 
          disabled={!userInfo || loading}
          style={{ marginRight: '10px', padding: '10px 16px' }}
        >
          购买测试
        </button>
        <button 
          onClick={handleGetBalance} 
          disabled={!userInfo}
          style={{ padding: '10px 16px' }}
        >
          查询余额
        </button>
      </div>
    </div>
  )
}

// 外层包装组件
export function TestSDK() {
  return (
    <HupuSDKProvider>
      <SDKTestInner />
    </HupuSDKProvider>
  )
}