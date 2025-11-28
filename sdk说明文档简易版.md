

```markdown
## 虎扑 H5 SDK 接入快速说明


### 、前端需要调用的主要方法

#### 1. 授权登录：`getTokenAndLogin()`

- **作用**：帮你完成「虎扑授权 → 调后端登录 → 拉取虎扑用户信息」，并把游戏 token 存起来。
- **调用示例**：

```js
const { getTokenAndLogin } = useHupuSDK()

const doLogin = async () => {
  const loginResult = await getTokenAndLogin()
  // loginResult 为后端返回的登录信息（包含游戏 token 等）
}

#### 2. 发起支付：`purchaseProduct(...)`

- **作用**：一行代码完成「查商品 → 组支付参数 → 调 SDK 支付」。
- **调用示例**：

```js
const { purchaseProduct } = useHupuSDK()

await purchaseProduct(
  {
    sku: '1',                 // 商品编号
    roleId: '当前角色ID',
    serverId: '当前区服ID',
    cp_order: '你们自己的唯一订单号',
  },
  () => {
    // 支付成功后，比如刷新余额
  }
)
```

#### 3. 查询余额：`getBalance()`

- **作用**：查询当前用户在虎扑侧的余额。
- **示例**：

```js
const { getBalance } = useHupuSDK()
const balance = await getBalance() // number 类型
```

---

### 三、后端 HTTP 接口说明

#### 1. 登录接口 `/login/otherHupuH5Login`

- **用途**：前端拿到虎扑 `accessToken` 后，调用此接口换取游戏登录态。
- **请求方式**：`POST`
- **请求路径**：`/login/otherHupuH5Login`

**请求参数（JSON body）**

| 字段名        | 类型   | 必填 | 说明                                           |
|---------------|--------|------|-----------------------------------------------|
| `accessToken` | string | 是   | 虎扑 SDK 返回的 `access_token`               |
| `gameId`      | string | 是   | 游戏 ID（前端会带，来自 `GAME_CONFIG.GAME_ID`） |
| `gameKey`     | string | 是   | 游戏密钥                                      |
| `gameVersion` | string | 是   | 游戏版本                                      |
| `sdkVersion`  | string | 是   | SDK 版本                                      |
| `deviceName`  | string | 是   | 设备类型，固定 `H5`                          |

> 实际请求里还会由前端底层自动补充一些公共参数和 token，后端按正常方式解析即可。

**返回字段（建议规范）**

```json
{
  "code": 1,
  "msg": "ok",
  "data": {
    "token": "游戏登录token",
    "...": "其他需要下发的用户/角色信息"
  }
}
```

字段说明：

| 字段名        | 类型   | 说明                                      |
|---------------|--------|-------------------------------------------|
| `code`        | number | 1 表示成功，非 1 表示失败                 |
| `msg`         | string | 错误或提示信息                            |
| `data`        | object | 登录成功后的业务数据                      |
| `data.token`  | string | 游戏登录 token，前端会存到 `localStorage.hupu_token` |

---

#### 2. 确认角色接口 `/user/chooseRole`

- **用途**：把当前区服 + 角色信息告诉你们后端做绑定/统计。
- **请求方式**：`POST`
- **请求路径**：`/user/chooseRole`

**请求参数（JSON body）**

| 字段名       | 类型   | 必填 | 说明             |
|--------------|--------|------|------------------|
| `serverId`   | string | 是   | 区服 ID          |
| `serverName` | string | 否   | 区服名称         |
| `roleId`     | string | 是   | 角色 ID          |
| `nickName`   | string | 是   | 角色名称         |
| `level`      | string | 否   | 角色等级         |
| `vip`        | string | 否   | VIP 等级         |
| 其他字段      | 任意   | 否   | 可按业务需要扩展 |

**返回字段（建议规范）**

```json
{
  "code": 1,
  "msg": "ok",
  "data": {}
}
```

字段说明：

| 字段名 | 类型   | 说明                       |
|--------|--------|----------------------------|
| `code` | number | 1 表示成功，非 1 表示失败 |
| `msg`  | string | 错误或提示信息             |
| `data` | object | 业务返回数据（无可为空对象） |

> 前端在成功后会本地打标：`localStorage.role_confirmed = 'true'`，用来控制按钮展示。

---

#### 3. 商品信息接口 `/order/getProductInfo`

- **用途**：根据商品 SKU 和角色信息，返回商品价格等信息，发起支付前必调。
- **请求方式**：`POST`
- **请求路径**：`/order/getProductInfo`

**请求参数（JSON body）**

| 字段名     | 类型   | 必填 | 说明          |
|------------|--------|------|---------------|
| `sku`      | string | 是   | 商品编号      |
| `roleId`   | string | 是   | 当前角色 ID   |
| `serverId` | string | 是   | 当前区服 ID   |
| `gameId`   | string | 是   | 游戏 ID       |

**返回字段（重点是 `data`）**

```json
{
  "code": 1,
  "msg": "ok",
  "data": {
    "sku": "1",
    "name": "商品名称",
    "amount": "10.0"
  }
}
```

字段说明：

| 字段名         | 类型           | 说明                                     |
|----------------|----------------|------------------------------------------|
| `code`         | number         | 1 成功，非 1 失败                        |
| `msg`          | string         | 提示信息                                 |
| `data.sku`     | string         | 商品编号                                 |
| `data.name`    | string         | 商品名称（如有）                         |
| `data.amount`  | string/number  | 商品金额，单位请与前端/虎扑明确约定      |

> 代码里目前是用 `amount * 10` 传给虎扑支付，建议双方确认金额单位后再最终定方案。

---

### 四、支付 & 余额（虎扑 SDK 视角）

#### 1. 发起支付（`reCharge`，已封装在 `purchaseProduct` 里）

前端不需要直接关心 `reCharge` 的参数细节，只要调用：

```js
await purchaseProduct({ sku, roleId, serverId, cp_order }, onSuccess)
```

内部会：

1. 用 `/order/getProductInfo` 拿 `amount` 等信息；
2. 组装虎扑要求的充值参数（金额、订单号、扩展字段等）；
3. 调用 `reCharge` 拉起支付；
4. 支付成功后执行 `onSuccess` 回调。

> 对接时只需要保证：**商品接口的 `amount` 单位 + 订单号 `cp_order` 唯一性** 符合你们的对账规则。

#### 2. 查询余额 `getBalance()`

SDK 期望返回类似：

```json
{
  "code": "SUCCESS",
  "data": {
    "balance": 1000,
    "currency": "积分"
  }
}
```

字段说明：

| 字段名           | 类型           | 说明                |
|------------------|----------------|---------------------|
| `code`           | string         | `"SUCCESS"` 表示成功 |
| `data.balance`   | string/number  | 余额数值           |
| `data.currency`  | string         | 币种，如“积分”等  |

前端会从 `data.balance` 取值并转成数字给业务使用。

---

### 五、接入方小提示

- **前端**：只要会用 `getTokenAndLogin`、`purchaseProduct`、`getBalance` 三个方法，其它细节都在 SDK 封装里。
- **后端**：重点是按上面表格实现三个接口：
  - `/login/otherHupuH5Login`
  - `/user/chooseRole`
  - `/order/getProductInfo`
- **金额和订单号**：
  - 提前确认金额单位（元 / 分），看是否需要在前端乘 10；
  - `cp_order` 一定要全局唯一，方便对账和幂等。
```