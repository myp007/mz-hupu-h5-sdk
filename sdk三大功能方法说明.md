## SDK 三大核心方法说明

本 Demo 主要提供三个核心操作按钮：

- 用户登录：`handleGetTokenAndLogin`（内部调用 `getTokenAndLogin`）
- 确认角色：`handleConfirmRole`
- 内购支付：`handlePurchase`

接入方只需要关心这三个方法的 **入参和返回值**，无需了解内部与虎扑 SDK、后端的交互细节。

---

### 一、用户登录：`handleGetTokenAndLogin`

**定义位置：** `src/App.jsx`  
**内部依赖：** `const { getTokenAndLogin } = useHupuSDK()`

#### 1.1 函数签名

```ts
handleGetTokenAndLogin(): Promise<void>
```

#### 1.2 入参

- 无参数。

#### 1.3 返回值

- `Promise<void>`：不向外返回数据，通过内部行为体现结果。

内部行为（供理解用）：

- 调用 `getTokenAndLogin()` 获取登录结果：
  - 成功时：
    - 弹出「✅ 登录成功！」提示；
    - 自动获取并刷新用户余额；
  - 失败时：
    - 捕获异常并弹出「❌ 登录失败: {错误信息}」。

> 对接方在使用 Demo 时，只需要在按钮上绑定这个方法即可，无需关心返回值结构。

---

### 二、确认角色：`handleConfirmRole`

**定义位置：** `src/App.jsx`  
**内部依赖：** `import { confirmRole } from './services/api'`

#### 2.1 函数签名

```ts
handleConfirmRole(): Promise<void>
```

#### 2.2 入参

- 无参数。

角色信息目前在函数内部写死传给 `confirmRole`，示例为：

```ts
confirmRole({
  serverId: '123',
  roleId: '123',
  level: '1',
  vip: '99',
  nickName: 'test',
  serverName: 'test123',
})
```

> 如果接入方需要使用真实的区服/角色数据，只需要把这里的字段替换成自己的实际值即可。

#### 2.3 返回值

- `Promise<void>`：不向外返回数据，通过内部行为体现结果。

内部行为（供理解用）：

- 调用 `confirmRole(...)` 后：
  - 成功（返回结果非空）：
    - 在 `localStorage` 中写入 `role_confirmed = 'true'`；
    - 弹出「✅ 角色确认成功！」提示；
  - 失败（抛出异常）：
    - 捕获异常并弹出「❌ 角色确认失败: {错误信息}」；
  - 期间会根据状态控制按钮的 loading 文案（“确认中...”）。

---

### 三、内购支付：`handlePurchase`

**定义位置：** `src/App.jsx`  
**内部依赖：** `const { purchaseProduct } = useHupuSDK()`

#### 3.1 函数签名

```ts
handlePurchase(): Promise<void>
```

#### 3.2 入参

- 无参数。

商品与角色参数在函数内部以固定值形式传入 `purchaseProduct`：

```ts
purchaseProduct({
  sku: '1',
  roleId: '1231',
  serverId: '1231',
})
```

字段含义（接入方上线时需替换为真实数据）：

- `sku`：商品编号，用来区分具体充值档位；
- `roleId`：当前角色 ID；
- `serverId`：当前区服 ID。

#### 3.3 返回值

- `Promise<void>`：不向外返回数据，通过内部行为体现结果。

内部行为（供理解用）：

- 调用 `purchaseProduct(...)` 后：
  - 成功（返回结果非空）：
    - 弹出「✅ 购买请求已发送！」提示；
    - 调用 `fetchUserBalance()` 再次请求余额并刷新页面上的余额展示；
  - 失败（抛出异常）：
    - 捕获异常并弹出「❌ 购买失败: {错误信息}」；
  - 期间会根据状态控制按钮的 loading 文案（“购买中...”）。

---

### 四、接入小结

- 三个方法对接方式都非常简单：
  - **登录：** 直接调用 `handleGetTokenAndLogin()`；
  - **确认角色：** 直接调用 `handleConfirmRole()`，如需真实角色信息，修改内部传给 `confirmRole` 的字段；
  - **支付：** 直接调用 `handlePurchase()`，如需真实商品/角色信息，修改内部传给 `purchaseProduct` 的字段。
- 所有网络请求、与虎扑 SDK 的交互、token 存储等细节，都已经封装在内部，接入方无需关心。


