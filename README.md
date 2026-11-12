<p align="center">
  <img src="docs/studio-dark.jpg" alt="主页卡片：输入 GitHub 用户名即可生成并定制实时名片" width="100%">
</p>

<h1 align="center">主页卡片</h1>

<p align="center">
  输入 GitHub 用户名或主页链接，生成一张实时更新、可定制的动态 SVG 名片。<br>
  支持公开 API、自用模式、可视化编辑器与中文管理后台。
</p>

<p align="center">
  <a href="https://profile.akucb.com/"><img alt="在线使用" src="https://img.shields.io/badge/在线使用-profile.akucb.com-d6422e?style=flat-square"></a>
  <a href="https://github.com/DearLicy/dearlicy-profile-card/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/DearLicy/dearlicy-profile-card?style=flat-square"></a>
  <img alt="Node.js 20+" src="https://img.shields.io/badge/Node.js-20%2B-3c873a?style=flat-square">
  <img alt="Docker Ready" src="https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker&logoColor=white">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-171717?style=flat-square">
</p>

## 在线使用

打开 **[profile.akucb.com](https://profile.akucb.com/)**，输入用户名、`@用户名` 或完整 GitHub 主页链接即可生成。

卡片会自动读取公开的 Stars、等级与评分、Followers、Repositories、年度贡献、语言构成和热门仓库。README 只需要一张 `<img>`，不需要 GitHub Actions 定时生成。

```html
<p align="center">
  <a href="https://profile.akucb.com/?username=YOUR_LOGIN">
    <img width="100%" src="https://profile.akucb.com/api?username=YOUR_LOGIN" alt="YOUR_LOGIN 的 GitHub 主页卡片">
  </a>
</p>
```

## 特点

- **一张动态卡片**：所有公开指标集中在一个 SVG 中，风格统一，自动刷新。
- **直接识别主页链接**：支持 `DearLicy`、`@DearLicy` 和 `https://github.com/DearLicy`。
- **五套视觉主题**：墨轨、校样、蓝图、海报、瑞士，分别采用轨道、编辑、终端、海报和网格构图，而不是简单换色。
- **可定制内容**：强调色、头像、两行标题、简介、状态徽标、页脚备注和热门仓库展示。
- **浏览器内嵌背景**：浏览器直接读取并压缩外部 HTTPS 图片，以不超过 18 KB 的 WebP 写入卡片链接；服务端不保存图片，也不消耗原图带宽。
- **公开 API 与自用模式**：实例所有者可以开放给所有人，也可以只允许指定账号。
- **中文管理后台**：访问模式、实例信息、默认外观、GitHub 连接、缓存维护分区管理。
- **组件化界面**：前后台均使用 Shoelace Web Components，不依赖浏览器原生表单外观。
- **可靠降级**：GitHub 暂时不可用时回退到 24 小时内快照；生成失败也返回完整错误卡，避免 README 破图。
- **自托管友好**：Docker、非 root、只读根文件系统、CSP、Origin 校验、加密凭据和自动证书续期均可配合使用。

## 预览

<table>
  <tr>
    <td width="50%"><img src="docs/studio-dark.jpg" alt="深色前台编辑器"></td>
    <td width="50%"><img src="docs/studio-light.jpg" alt="浅色前台编辑器"></td>
  </tr>
</table>

<p align="center">
  <img src="docs/card-midnight.jpg" alt="墨轨主题动态卡片" width="68%">
</p>

## 管理后台

访问 `/admin`，使用环境变量 `ADMIN_SECRET` 登录。

<p align="center">
  <img src="docs/admin-dark.jpg" alt="管理后台深色主题" width="100%">
</p>

<details>
<summary>查看浅色与移动端后台</summary>
<br>
<p align="center">
  <img src="docs/admin-light.jpg" alt="管理后台浅色主题" width="100%">
</p>
<p align="center">
  <img src="docs/admin-mobile.jpg" alt="管理后台移动端" width="390">
</p>
</details>

## GitHub 数据连接

匿名 GitHub REST 接口通常只提供 **每小时 60 次请求**。如果实例需要更高额度，可在后台保存一条服务端只读 Token，将数据通道提升到 GraphQL，通常可获得 **每小时 5,000 次请求**。

这里推荐只读 Personal Access Token，而不是让访客登录 GitHub：

- 本产品读取的是公开数据，不存在“每位用户授权自己的账号”的必要。
- 不需要额外维护授权应用、Client Secret 和回调地址。
- 后台可测试当前连接，并显示正在使用匿名 REST 还是已配置的 GraphQL。
- 不配置 Token 也能正常运行，只是请求额度较低。

创建入口：

```text
https://github.com/settings/tokens/new?description=Profile%20Card%20(read-only)
```

本服务只需要读取公开信息，不需要私有仓库权限。令牌会使用由 `ADMIN_SECRET` 派生的 AES-GCM 密钥加密保存在 `data/config.json`，后台不会返回明文。

## API

| 路由 | 说明 |
| --- | --- |
| `GET /api` | 输出动态 SVG，单张卡片 |
| `GET /api/card`、`/card.svg`、`/profile.svg` | SVG 路由别名 |
| `GET /api/summary` | 卡片对应的 JSON 指标，开启 CORS |
| `GET /api/site` | 当前实例的公开模式、默认用户与主题元数据 |
| `GET /api/health`、`/health` | 健康检查 |
| `GET /admin` | 中文管理后台 |

### 查询参数

| 参数 | 示例 | 说明 |
| --- | --- | --- |
| `username` / `user` / `url` | `DearLicy` | GitHub 用户名、`@username` 或主页 URL |
| `theme` | `midnight` | `midnight`、`ivory`、`ocean`、`ember`、`graphite`，对应五种不同构图 |
| `accent` | `%23D6422E` | 六位十六进制强调色，`#` 需要 URL 编码 |
| `bg` | `https%3A%2F%2F...` | 背景图源。默认仅作为前台处理提示，不会让服务器抓取 |
| `bgData` | `UklGR...` | 浏览器压缩后的 URL-safe WebP 数据，默认背景渲染方式 |
| `photo` | `https%3A%2F%2F...` | 自定义头像 URL |
| `mark` | `DEARLICY` | 左上角标识，最多 24 字符 |
| `h1` / `h2` | `Designing+useful` | 两行标题，最多 42 / 48 字符 |
| `intro` | `Open+source...` | 简介，最多 120 字符 |
| `badge` | `BUILDING+NOW` | 状态徽标，最多 64 字符 |
| `note` | `KEEP+SHIPPING.` | 页脚备注，最多 64 字符 |
| `bgTL` / `bgTR` / `bgBL` / `bgBR` | `0.5` | 左上、右上、左下、右下透明度，范围 0–1 |
| `refresh=1` | `1` | 跳过 5 分钟新鲜缓存，受 20 秒冷却限制 |

示例：

```bash
curl -o card.svg \
  'https://profile.akucb.com/api?username=DearLicy&theme=ocean&accent=%235D86FF&bgTL=0.7&bgTR=0.2&bgBL=0.5&bgBR=0.1'
```

### 图片处理

- 前台会先在**用户浏览器**中读取原图，按卡片比例裁切，并自动降低尺寸与质量，直到生成的 WebP 不超过 18 KB。
- 压缩结果以 base64url 写入 `bgData`，服务端只负责解码为轻量 SVG data URI。服务器不会保存压缩图，也不会代理原图。
- GitHub README 会经过 Camo 图片代理；当前实现把查询串控制在安全范围，避免长链接被 GitHub 截断。
- 外部图片必须允许浏览器跨域读取（CORS）。源站禁止跨域、响应过慢或撤回图片时，前台会给出明确错误，而不是生成裂图。
- `bg` 可保存默认图源；默认实例不会用服务器抓取它。只有 `ALLOW_SERVER_BACKGROUND_FETCH=true` 时才启用旧式服务端回退，这会消耗服务器带宽，不建议开启。
- 头像会优先使用 GitHub 返回的数据。自定义 `photo` 与受信任图片主机可通过白名单控制；`ALLOW_REMOTE_ASSET_FETCH` 默认关闭，避免把服务端变成任意 URL 代理。
- 可通过 `ASSET_HOSTS` 追加允许服务端读取的域名，逗号分隔。

### 缓存策略

- 同一 GitHub 用户的数据缓存 5 分钟。
- 并发刷新会合并为一次 GitHub 请求。
- GitHub 异常时可回退 24 小时内的成功快照。
- `refresh=1` 有 20 秒冷却。
- GraphQL 查询显式限制为公开仓库，私有代码不会进入统计。

## 自托管

### 环境要求

- Node.js 20+
- Docker 与 Docker Compose（推荐）
- 带 HTTPS 的反向代理

### Docker 启动

```bash
cp .env.example .env
openssl rand -hex 32
```

将随机值写入 `.env` 的 `ADMIN_SECRET`，按需填写 `GITHUB_TOKEN`，然后：

```bash
mkdir -p data
sudo chown -R 1000:1000 data
docker compose up -d --build
curl http://127.0.0.1:3410/health
```

Compose 默认只监听 `127.0.0.1:3410`。反向代理不在本仓库内提供，请按自己的 Nginx、Caddy、Cloudflare Tunnel 或其他网关方案接入 HTTPS。

网关只需要把请求转发到 `127.0.0.1:3410`，并保留 `Host`、`X-Forwarded-Proto` 与 `X-Forwarded-Host`。如果使用浏览器内嵌背景，还需要让网关允许较长的请求头，否则可能返回 `431 Request Header Fields Too Large`。

### 备份

需要备份的是 `data/config.json`。其中包含实例配置和加密后的凭据；恢复时必须继续使用相同的 `ADMIN_SECRET`，否则旧凭据无法解密。

## 本地开发

```bash
npm install
cp .env.example .env
# 编辑 .env，至少设置 ADMIN_SECRET
npm run dev
```

打开 `http://127.0.0.1:3410/`。不配置 `GITHUB_TOKEN` 时会自动使用匿名公开 REST。

```bash
npm test
```

生成一个不经过 HTTP 服务的 SVG：

```bash
GITHUB_USERNAME=DearLicy GITHUB_TOKEN="$(gh auth token)" npm run render
```

## 项目结构

```text
src/
  index.js            兼容入口与 Worker fetch facade
  http.js             HTTP 响应与缓存工具
  runtime.js          实例配置、凭据与访问控制
  handlers/           公开卡片与前台路由
  admin/              后台鉴权、路由与配置控制
  github.js           GitHub GraphQL / REST 数据层
  profile-service.js  内存与 Cache API 缓存
  card.js             SVG 渲染 facade
  card-kit.js         共享 SVG 绘图与动画工具
  card-themes/        五套结构不同的 SVG 构图
  page.js / studio-ui.js       前台编辑器与界面样式
  admin-page.js / admin-ui.js  中文管理后台与登录页
  design-system.js    印刷工作室设计系统
  config.js           主题、布局与卡片参数
  site-config.js      实例配置与访问模式
  assets.js           图片校验、服务端回退与内嵌数据解码
server/
  site-store.mjs      文件持久化与加密凭据
  application.mjs     Node HTTP 适配与安全日志
  bootstrap.mjs       进程启动与优雅关闭
  vendor.mjs          Shoelace / Lit 静态资源
server.mjs            Node 入口
```

## 环境变量

| 变量 | 必填 | 作用 |
| --- | --- | --- |
| `ADMIN_SECRET` | 是 | 管理员登录与凭据加密密钥，至少 24 字符 |
| `GITHUB_TOKEN` | 否 | 服务端只读 GitHub Token |
| `ASSET_HOSTS` | 否 | 允许服务端代理的其他图片域名，逗号分隔 |
| `ALLOW_SERVER_BACKGROUND_FETCH` | 否 | 是否允许服务端抓取 `bg`，默认 `false` |
| `ALLOW_REMOTE_ASSET_FETCH` | 否 | 是否允许服务端抓取白名单外的头像，默认 `false` |
| `SITE_MODE` | 否 | 首次启动的 `public` / `private` 默认值 |
| `DEFAULT_USERNAME` | 否 | 首次启动的默认 GitHub 用户 |
| `PUBLIC_REPO_URL` | 否 | 前台右上角 GitHub 按钮的目标地址 |
| `DATA_DIR` | 否 | 持久化目录，Docker 中为 `/app/data` |
| `PORT` / `HOST` | 否 | 监听端口与地址 |

后台保存的配置会覆盖 `SITE_MODE`、`DEFAULT_USERNAME` 和 `PUBLIC_REPO_URL` 的初始值。

## 安全与隐私

- 不请求、不统计、不展示私有仓库。
- GitHub Token 不会出现在 HTML、SVG、JSON、日志或 Git 中。
- 请求日志不会记录 `bgData`、`bg`、`photo` 等查询参数内容。
- 管理后台 Cookie 使用 `HttpOnly`、`SameSite=Lax`，HTTPS 下自动启用 `Secure`。
- 所有写操作校验 Origin，并带有登录尝试限速。
- Docker 容器以非 root 用户运行，丢弃 Linux capabilities，根文件系统只读，仅 `/app/data` 和 `/tmp` 可写。
- 公开实例仍应遵守 GitHub API 规则；大规模使用建议配置只读 Token，并在反向代理层增加限速。

安全细节见 [`SECURITY.md`](SECURITY.md)。

## License

[MIT](LICENSE) © 2026 DearLicy
