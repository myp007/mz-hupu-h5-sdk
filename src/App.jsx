import { useState, useEffect } from 'react'
import { HupuSDKProvider, useHupuSDK } from './hooks/useHupuSDK.jsx'
import { confirmRole } from './services/api'
import './App.css'

function SDKDemo() {
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(null) // 新增余额状态
  const { 
    hupuUserInfo,
    loading, 
    getTokenAndLogin,
    purchaseProduct,
    getBalance // 新增获取余额方法
  } = useHupuSDK()

  // 获取用户余额
  const fetchUserBalance = async () => {
    try {
      const balance = await getBalance()
      setUserBalance(balance)
    } catch (error) {
      console.error('获取余额失败:', error)
      setUserBalance(0)
    }
  }

  // 当用户信息变化时获取余额
  useEffect(() => {
    if (hupuUserInfo) {
      fetchUserBalance()
    }
  }, [hupuUserInfo])

  const handleGetTokenAndLogin = async () => {
    try {
      const result = await getTokenAndLogin()
      if (result) {
        alert(`✅ 登录成功！`)
        // 登录成功后获取余额
        await fetchUserBalance()
      }
    } catch (error) {
      alert(`❌ 登录失败: ${error.message}`)
    }
  }

  const handleConfirmRole = async () => {
    setConfirmLoading(true)
    try {
      const result = await confirmRole()
      if (result) {
        localStorage.setItem('role_confirmed', 'true')
        alert('✅ 角色确认成功！')
      }
    } catch (error) {
      alert(`❌ 角色确认失败: ${error.message}`)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handlePurchase = async () => {
    setPurchaseLoading(true)
    try {
      const result = await purchaseProduct({
        sku: '1',
        roleId: '1231',
        serverId: '1231'
      })
      if (result) {
        alert('✅ 购买请求已发送！')
        // 购买成功后刷新余额
        await fetchUserBalance()
      }
    } catch (error) {
      alert(`❌ 购买失败: ${error.message}`)
    } finally {
      setPurchaseLoading(false)
    }
  }

  // 清除用户信息
  const handleClearUserInfo = () => {
    localStorage.removeItem('hupu_token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('role_confirmed')
    setUserBalance(null) // 清除余额状态
    window.location.reload()
  }

  // 判断显示哪个阶段的按钮
  const showLoginButtons = !hupuUserInfo
  const showRoleConfirm = hupuUserInfo && !localStorage.getItem('role_confirmed')
  const showPurchase = hupuUserInfo && localStorage.getItem('role_confirmed')

  return (
    <div className="app">
      <div className="card">
        {/* 用户信息显示区域 */}
        {hupuUserInfo && (
          <div className="user-info">
            {/* 重新登录按钮 - 右上角 */}
            <button 
              className="relogin-btn"
              onClick={handleClearUserInfo}
            >
              重新登录
            </button>
            
            <h3>用户信息</h3>
            <div className="user-detail">
              {hupuUserInfo.header ? (
                <div className="avatar-section">
                  <img 
                    src={hupuUserInfo.header} 
                    alt="用户头像" 
                    className="user-avatar"
                  />
                </div>
              ) : (
                <div className="avatar-placeholder">
                  <span>暂无头像</span>
                </div>
              )}
              <div className="nickname-section">
                <p className="nickname">{hupuUserInfo.nickname || '未知用户'}</p>
              </div>
              
              {/* 显示用户余额 */}
              {userBalance !== null && (
                <div className="balance-section">
                  <p className="balance">
                    <strong>余额:</strong> {userBalance.toFixed(2)} 元
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="button-group">
          {/* 阶段1: 登录 */}
          {showLoginButtons && (
            <button 
              onClick={handleGetTokenAndLogin} 
              className="sdk-btn login-btn"
              disabled={loading}
            >
              {loading ? '登录中...' : '用户登录'}
            </button>
          )}

          {/* 阶段2: 确认角色 */}
          {showRoleConfirm && (
            <button 
              onClick={handleConfirmRole} 
              className="sdk-btn confirm-role-btn"
              disabled={confirmLoading}
            >
              {confirmLoading ? '确认中...' : '确认角色'}
            </button>
          )}

          {/* 阶段3: 内购 */}
          {showPurchase && (
            <button 
              onClick={handlePurchase} 
              className="sdk-btn purchase-btn"
              disabled={purchaseLoading}
            >
              {purchaseLoading ? '购买中...' : '购买商品'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <HupuSDKProvider>
      <SDKDemo />
    </HupuSDKProvider>
  )
}

export default App