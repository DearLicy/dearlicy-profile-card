<p align="center">
  <img src="docs/studio-dark.jpg" alt="Profile Card Studio — dynamic GitHub profile card editor" width="100%">
</p>

<h1 align="center">Dynamic GitHub Profile Card</h1>

<p align="center">
  把任意公开 GitHub 主页变成一张实时更新、可深度定制的动画 SVG。
  README 只需要一张图。也可以直接使用我们的
  <a href="https://profile.akucb.com/">在线实例</a>。
</p>

<p align="center">
  <a href="https://profile.akucb.com/"><img alt="Live demo" src="https://img.shields.io/badge/live-demo-cbb9ff?style=flat-square&logo=github&logoColor=171717"></a>
  <a href="https://github.com/DearLicy/dearlicy-profile-card/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/DearLicy/dearlicy-profile-card?style=flat-square"></a>
  <img alt="Node 20+" src="https://img.shields.io/badge/Node.js-20%2B-3c873a?style=flat-square">
  <img alt="Docker ready" src="https://img.shields.io/badge/Docker-ready-2496ed?style=flat-square&logo=docker&logoColor=white">
  <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-171717?style=flat-square">
</p>

## 为什么是一张卡片

传统 README 往往堆叠多张统计图、徽章和项目列表，信息重复，风格也很难统一。

这个项目把 Stars、Rank、Followers、Repositories、年度贡献、语言构成和热门仓库放进**同一张动态 SVG**。用户只写一个 `<img>`，数据由服务端实时拉取，不需要每日 Actions 生成静态文件。

<p align="center">
  <img src="docs/card-midnight.jpg" alt="Rendered dynamic GitHub profile card" width="72%">
</p>

## 功能

- **动态数据**：Stars、Rank 与评分、Followers、Repositories、年度贡献、语言和 Top Repositories。
- **完整支持主页链接**：`DearLicy`、`@DearLicy`、`https://github.com/DearLicy` 都可以。
- **五种不同视觉**：Midnight / Ivory / Ocean / Ember / Graphite，分别使用轨道、画框、终端、暖框和极简头像构图。
- **可视化 Studio**：主题、强调色、头像 URL、文案、状态徽标、页脚、README 代码全部实时更新。
- **外部背景图**：不要求上传到本服务；支持 HTTPS 图片 URL、四角独立透明度和柔化遮罩。
- **公开 API / 自用模式**：实例所有者可限制只有指定 GitHub 用户可请求。
- **最小管理后台**：管理员密钥登录、默认配置持久化、Token 状态、OAuth 连接、缓存清理和访问模式切换。
- **GitHub OAuth**：可在后台连接 GitHub OAuth App，将服务端请求从匿名 REST 提升到更有余量的数据通道。
- **高可用降级**：GitHub 暂时失败时可回退到最近 24 小时的成功快照；SVG 失败也返回错误卡，避免 README 破图。
- **响应式、安全、可部署**：Docker、非 root、只读容器、受限端口、CSP、Origin 校验和加密凭据。

## 快速嵌入

把下面的域名替换成你部署的实例：

```html
<p align="center">
  <a href="https://profile.example.com/?username=YOUR_LOGIN">
    <img width="100%" src="https://profile.example.com/api?username=YOUR_LOGIN" alt="YOUR_LOGIN — dynamic GitHub profile">
  </a>
</p>
```

打开 Studio，可以可视化调整全部参数并直接复制生成的 README 代码。

## Studio

<table>
  <tr>
    <td><img src="docs/studio-dark.jpg" alt="Dark Studio"></td>
    <td><img src="docs/studio-light.jpg" alt="Light Studio"></td>
  </tr>
</table>

Studio 路由：

- `/` — 可交互卡片编辑器。
- `/api`、`/api/card`、`/card.svg`、`/profile.svg` — 动态 SVG，互为别名。
- `/api/summary` — 卡片对应的 JSON 指标，开启 CORS。
- `/api/site` — 当前实例的公开模式、默认用户和主题元数据。
- `/api/health`、`/health` — 健康检查。
- `/admin` — 管理员后台，只有配置 `ADMIN_SECRET` 后可进入。

## API 参数

| 参数 | 示例 | 说明 |
| --- | --- | --- |
| `username` / `user` / `url` | `DearLicy` | GitHub 用户名、`@username` 或主页 URL |
| `theme` | `midnight` | `midnight`、`ivory`、`ocean`、`ember`、`graphite` |
| `accent` | `%23FFB07C` | 6 位十六进制强调色，`#` 需要 URL 编码 |
| `bg` | `https%3A%2F%2F...` | 外部 HTTPS 背景图 |
| `photo` | `https%3A%2F%2F...` | 自定义头像 URL |
| `mark` | `DEARLICY` | 左上角标识，最多 24 字符 |
| `h1` / `h2` | `Designing+useful` | 两行标题，最多 42 / 48 字符 |
| `intro` | `Open+source...` | 简介，最多 120 字符 |
| `badge` | `BUILDING+NOW` | 状态徽标，最多 64 字符 |
| `note` | `KEEP+SHIPPING.` | 页脚备注，最多 64 字符 |
| `bgTL` / `bgTR` / `bgBR` / `bgBL` | `0.5` | 四角透明度，范围 0–1 |
| `refresh=1` | `1` | 跳过 5 分钟新鲜缓存，受 20 秒冷却限制 |

示例：

```bash
curl -o card.svg \
  'https://profile.example.com/api?username=DearLicy&theme=ocean&accent=%2365D6C4&bgTL=0.7&bgTR=0.2&bgBR=0.5&bgBL=0.1'
```

### 图片处理

背景和头像不需要上传到服务端：

- 已知图片主机（GitHub、Unsplash、jsDelivr、Imgur）会由服务端读取并转成 data URI，兼容性最好。
- 其他 HTTPS 图片地址会直接嵌入 SVG；是否能被 GitHub 的图片代理访问，取决于目标站点是否允许抓取。
- 可通过 `ASSET_HOSTS` 增加允许服务器代理的额外主机，逗号分隔。
- 本服务不会把用户图片持久化到磁盘或数据卷。

## 缓存与数据

- 每个 GitHub 用户的成功数据缓存 5 分钟。
- 同一用户的并发刷新会合并，避免重复请求 GitHub。
- GitHub 暂时不可用时，可回退到 24 小时内的陈旧快照。
- `refresh=1` 有 20 秒冷却。
- 有 `GITHUB_TOKEN` 或 OAuth Token 时使用 GitHub GraphQL。
- 未配置 Token 时自动回退公开 REST；匿名 API 限额由 GitHub 控制，通常为每小时 60 次。
- 私有仓库不会进入任何统计。GraphQL 查询显式使用 `privacy: PUBLIC`。

## 管理后台

访问 `https://your-domain/admin`。

登录密钥来自环境变量 `ADMIN_SECRET`。后台支持：

- 公开 API / 自用模式切换。
- 默认 GitHub 用户与自用模式允许列表。
- 默认主题、强调色、文案、头像和背景。
- 外部背景四角透明度。
- 只读 GitHub Token 的写入与清除。
- GitHub OAuth Client ID / Secret 与授权连接。
- 清理数据缓存。
- 开源仓库 CTA 地址。

保存后的配置写入数据目录 `config.json`。Token 和 OAuth Secret 使用由 `ADMIN_SECRET` 派生的 AES-GCM 密钥加密，后台接口不会返回明文。

<p align="center">
  <img src="docs/admin-dark.jpg" alt="Profile Card admin dashboard" width="100%">
</p>

### GitHub OAuth

在 GitHub 创建 OAuth App：

- Homepage URL：`https://your-domain`
- Authorization callback URL：`https://your-domain/admin/oauth/github/callback`

把 Client ID 和 Client Secret 保存到后台，然后点击“连接 GitHub OAuth”。授权范围只需要 `read:user`。

不连接 OAuth 时，也可以直接在后台保存一个只读 Personal Access Token。

## Docker 部署

### 1. 准备环境变量

```bash
cp .env.example .env
openssl rand -hex 32
```

把随机值写入 `.env` 的 `ADMIN_SECRET`。不要提交 `.env`。

### 2. 启动

```bash
mkdir -p data
sudo chown -R 1000:1000 data
docker compose up -d --build
curl http://127.0.0.1:3410/health
```

Compose 默认只绑定 `127.0.0.1:3410`。对外访问应通过 Nginx、Caddy 或 Cloudflare Tunnel。

### 3. Nginx 反向代理

仓库包含 [`deploy/nginx.conf`](deploy/nginx.conf)。确保：

- `proxy_set_header Host $host;`
- `proxy_set_header X-Forwarded-Proto $scheme;`
- `proxy_set_header X-Forwarded-Host $host;`

HTTPS 会影响管理员 Cookie 的 `Secure` 属性和 OAuth 回调地址。

### 4. 备份

需要备份的是 `data/config.json`。它包含实例配置和加密后的凭据。恢复时需要保持相同的 `ADMIN_SECRET`，否则旧凭据无法解密。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
cp .env.example .env
# 编辑 .env，至少设置 ADMIN_SECRET
npm run dev
```

打开 `http://127.0.0.1:3410/`。

如果不配置 `GITHUB_TOKEN`，服务会自动使用匿名公开 REST。若需要频繁调试，建议设置只读 Token：

```bash
GITHUB_TOKEN="$(gh auth token)" npm run dev
```

运行测试：

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
  index.js          HTTP 路由与公开 API
  github.js         GitHub GraphQL / REST 数据层
  profile-service.js 内存与 Cache API 缓存
  card.js           动态 SVG 渲染
  page.js           Studio
  admin.js          管理员鉴权、OAuth 与配置 API
  admin-page.js     管理后台界面
  config.js         主题、布局与卡片参数
  site-config.js    实例配置模型与访问模式
  assets.js         外部图片处理
server/
  site-store.mjs    文件持久化与加密凭据
server.mjs          Node HTTP 入口
```

## 可配置环境变量

| 变量 | 必填 | 作用 |
| --- | --- | --- |
| `ADMIN_SECRET` | 是 | 管理员登录与凭据加密密钥，至少 24 字符 |
| `GITHUB_TOKEN` | 否 | 服务端只读 GitHub Token |
| `GITHUB_CLIENT_ID` | 否 | OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | 否 | OAuth App Client Secret |
| `ASSET_HOSTS` | 否 | 允许服务端代理的其他图片域名，逗号分隔 |
| `SITE_MODE` | 否 | 首次启动的 `public` / `private` 默认值 |
| `DEFAULT_USERNAME` | 否 | 首次启动的默认 GitHub 用户 |
| `PUBLIC_REPO_URL` | 否 | Studio 右上角 CTA 目标 |
| `DATA_DIR` | 否 | 持久化目录，Docker 中为 `/app/data` |
| `PORT` / `HOST` | 否 | 监听端口与地址 |

后台保存的配置会覆盖 `SITE_MODE`、`DEFAULT_USERNAME` 和 `PUBLIC_REPO_URL` 的初始值。

## 隐私与安全

- 不请求、不统计、不展示私有仓库。
- GitHub Token 与 OAuth Secret 不会出现在 HTML、SVG、JSON、日志或 Git 中。
- 管理员 Cookie 使用 `HttpOnly`、`SameSite=Lax` 和 HTTPS 下的 `Secure`。
- 所有写操作校验 Origin，并带有登录尝试限速。
- Docker 容器以非 root 用户运行，丢弃 Linux capabilities，根文件系统只读，只有 `/app/data` 和 `/tmp` 可写。
- 公开模式仍需遵守 GitHub 的 API 使用规则。大量用户场景请配置 Token / OAuth，并在反向代理层增加限速。

安全细节见 [`SECURITY.md`](SECURITY.md)。

## License

[MIT](LICENSE) © 2026 DearLicy
