# mz-h5-sdk

虎扑H5 SDK React封装库，提供授权登录、角色确认、商品内购等核心功能。

## 功能特性

- ✅ **授权登录** - 虎扑H5环境下的用户登录认证
- ✅ **角色确认** - 游戏角色信息确认和上报
- ✅ **商品内购** - 完整的商品购买流程（获取商品信息、充值、购买）
- ✅ **用户信息** - 获取用户详细信息和余额
- ✅ **开发模式** - 支持开发环境下的模拟SDK测试

## 安装

```bash
npm install mz-h5-sdk
# 或
yarn add mz-h5-sdk
# 或
pnpm add mz-h5-sdk
```

## 快速开始

### 1. 在应用根组件包裹 Provider

```jsx
import { HupuSDKProvider } from 'mz-h5-sdk'

function App() {
  return (
    <HupuSDKProvider>
      <YourApp />
    </HupuSDKProvider>
  )
}
```

#### 配置选项（可选）

```jsx
import { HupuSDKProvider } from 'mz-h5-sdk'

function App() {
  const config = {
    // 游戏配置（可选）
    gameConfig: {
      GAME_ID: '2661',
      GAME_KEY: 'your-game-key',
      GAME_VERSION: '1.0',
      SDK_VERSION: '6.1.0'
    }
  }

  return (
    <HupuSDKProvider config={config}>
      <YourApp />
    </HupuSDKProvider>
  )
}
```

### 2. 在组件中使用 Hook

```jsx
import { useHupuSDK } from 'mz-h5-sdk'

function YourComponent() {
  const {
    // 状态
    sdkReady,        // SDK是否就绪
    loading,         // 登录加载状态
    userInfo,        // 用户信息（后端返回）
    hupuUserInfo,    // 虎扑用户信息
    
    // 方法
    loginWithHupu,   // 登录
    confirmRole,     // 确认角色
    purchaseProduct, // 购买商品
    getBalance,      // 获取余额
  } = useHupuSDK()

  // 使用示例...
}
```

## API 文档

### HupuSDKProvider

SDK的上下文提供者，需要在应用根组件使用。

**Props:**
- `children` - React子组件

### useHupuSDK Hook

返回SDK的所有状态和方法。

#### 状态

| 属性 | 类型 | 说明 |
|------|------|------|
| `sdkReady` | `boolean` | SDK是否初始化完成 |
| `loading` | `boolean` | 登录请求加载状态 |
| `userInfo` | `object \| null` | 后端返回的用户信息 |
| `hupuUserInfo` | `object \| null` | 虎扑SDK返回的用户详细信息 |
| `isInHupuApp` | `boolean` | 是否在虎扑App内 |
| `isDevMode` | `boolean` | 是否为开发模式 |
| `autoLogin` | `boolean` | 是否自动登录 |

#### 方法

##### 登录相关

**loginWithHupu()**
- 描述：执行虎扑H5登录
- 返回：`Promise<object>` - 登录结果，包含token等信息
- 示例：
```jsx
const handleLogin = async () => {
  try {
    const result = await loginWithHupu()
    console.log('登录成功:', result)
  } catch (error) {
    console.error('登录失败:', error)
  }
}
```

**getTokenAndLogin()**
- 描述：获取token并立即登录（组合方法）
- 返回：`Promise<object>` - 登录结果

**getHupuUserDetail()**
- 描述：获取虎扑用户详细信息
- 返回：`Promise<object>` - 用户详细信息

##### 角色相关

**confirmRole(roleData)**
- 描述：确认角色信息
- 参数：
  ```js
  {
    serverId: string,    // 服务器ID
    roleId: string,      // 角色ID
    level: string,       // 角色等级
    vip: string,         // VIP等级
    nickName: string,    // 角色昵称
    serverName: string   // 服务器名称
  }
  ```
- 返回：`Promise<object>` - 确认结果
- 示例：
```jsx
const handleConfirmRole = async () => {
  try {
    const result = await confirmRole({
      serverId: '123',
      roleId: '456',
      level: '10',
      vip: '1',
      nickName: '测试角色',
      serverName: '测试服'
    })
    console.log('角色确认成功:', result)
  } catch (error) {
    console.error('角色确认失败:', error)
  }
}
```

**reportRole(roleData)**
- 描述：上报角色日志
- 参数：
  ```js
  {
    serverId: string,
    roleId: string,
    roleName: string,
    createRoleTime: number
  }
  ```
- 返回：`Promise<object>`

##### 内购相关

**getProductInfo(productData)**
- 描述：获取商品信息
- 参数：
  ```js
  {
    sku: string,        // 商品SKU
    roleId: string,    // 角色ID
    serverId: string,  // 服务器ID
    gameId: string     // 游戏ID（可选）
  }
  ```
- 返回：`Promise<object>` - 商品信息

**purchaseProduct(productParams, onSuccess)**
- 描述：完整的购买流程（获取商品信息 + 充值）
- 参数：
  - `productParams` - 商品参数（同 getProductInfo）
  - `onSuccess` - 购买成功回调函数（可选）
- 返回：`Promise<object>` - 购买结果
- 示例：
```jsx
const handlePurchase = async () => {
  try {
    const result = await purchaseProduct({
      sku: '1',
      roleId: '123',
      serverId: '456',
      cp_order: 'order_123456' // 订单号
    }, () => {
      // 购买成功后的回调，可以刷新余额等
      getBalance()
    })
    console.log('购买成功:', result)
  } catch (error) {
    console.error('购买失败:', error)
  }
}
```

**getBalance()**
- 描述：获取用户余额
- 返回：`Promise<number>` - 余额（单位：元）
- 示例：
```jsx
const handleGetBalance = async () => {
  try {
    const balance = await getBalance()
    console.log('用户余额:', balance)
  } catch (error) {
    console.error('获取余额失败:', error)
  }
}
```

**recharge(rechargeData)**
- 描述：调用SDK充值接口
- 参数：
  ```js
  {
    amount: number,     // 充值金额（单位：分，需要乘以10）
    extInfo: {
      other: string,
      orderId: string,
      self: {
        game_id: string,
        cp_order: string,
        sku: string,
        server_id: string
      }
    }
  }
  ```
- 返回：`Promise<object>`

## 完整使用示例

```jsx
import { HupuSDKProvider, useHupuSDK } from 'mz-h5-sdk'

function GameComponent() {
  const {
    sdkReady,
    loading,
    userInfo,
    hupuUserInfo,
    loginWithHupu,
    confirmRole,
    purchaseProduct,
    getBalance
  } = useHupuSDK()

  // 1. 登录
  const handleLogin = async () => {
    if (!sdkReady) {
      alert('SDK未就绪')
      return
    }
    try {
      const result = await loginWithHupu()
      alert('登录成功！')
    } catch (error) {
      alert(`登录失败: ${error.message}`)
    }
  }

  // 2. 确认角色
  const handleConfirmRole = async () => {
    try {
      await confirmRole({
        serverId: '123',
        roleId: '456',
        level: '10',
        vip: '1',
        nickName: '我的角色',
        serverName: '服务器1'
      })
      alert('角色确认成功！')
    } catch (error) {
      alert(`角色确认失败: ${error.message}`)
    }
  }

  // 3. 购买商品
  const handlePurchase = async () => {
    try {
      await purchaseProduct({
        sku: '1',
        roleId: '456',
        serverId: '123',
        cp_order: `order_${Date.now()}`
      }, async () => {
        // 购买成功后刷新余额
        const balance = await getBalance()
        console.log('当前余额:', balance)
      })
      alert('购买成功！')
    } catch (error) {
      alert(`购买失败: ${error.message}`)
    }
  }

  return (
    <div>
      {!userInfo && (
        <button onClick={handleLogin} disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      )}
      
      {userInfo && !localStorage.getItem('role_confirmed') && (
        <button onClick={handleConfirmRole}>
          确认角色
        </button>
      )}
      
      {userInfo && localStorage.getItem('role_confirmed') && (
        <button onClick={handlePurchase}>
          购买商品
        </button>
      )}
    </div>
  )
}

function App() {
  return (
    <HupuSDKProvider>
      <GameComponent />
    </HupuSDKProvider>
  )
}
```

## 环境要求

- React >= 18
- React DOM >= 18

## 开发模式

在开发环境下（localhost 或 127.0.0.1），SDK会自动使用模拟数据，方便本地开发和测试。

## 注意事项

1. **环境检测**：SDK会自动检测是否在虎扑App内或允许的域名下运行
2. **自动登录**：在虎扑App内，SDK初始化完成后会自动尝试登录
3. **Token存储**：登录成功后，token会自动保存到 `localStorage` 的 `hupu_token` 键
4. **API配置**：当前API基础URL为 `https://mzsdkapi.higame.cn/api/v2`，如需修改请自行配置

## 许可证

MIT

## 更新日志

### 0.1.0
- 初始版本
- 支持授权登录
- 支持角色确认
- 支持商品内购
