<p align="center">
  <img src="docs/studio-dark.jpg" alt="主页卡片：输入 GitHub 用户名即可生成并定制实时名片" width="100%">
</p>

<h1 align="center">主页卡片</h1>

<p align="center">
  输入 GitHub 用户名或主页链接，生成一张实时更新、可定制的动态 SVG 名片。<br>
  支持公开 API、自用模式、可视化编辑器与中文管理后台。
</p>

<p align="center">
  <a href="https://profile.galgame.vip/"><img alt="在线使用" src="https://img.shields.io/badge/在线使用-profile.galgame.vip-d6422e?style=flat-square"></a>
  <a href="https://github.com/DearLicy/dearlicy-profile-card/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/DearLicy/dearlicy-profile-card?style=flat-square"></a>
  <img alt="Node.js 20+" src="https://img.shields.io/badge/Node.js-20%2B-3c873a?style=flat-square">
  <img alt="Docker Ready" src="https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker&logoColor=white">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-171717?style=flat-square">
</p>

## 在线使用

打开 **[profile.galgame.vip](https://profile.galgame.vip/)**，输入用户名、`@用户名` 或完整 GitHub 主页链接即可生成。

卡片会自动读取公开的 Stars、等级与评分、Followers、Repositories、年度贡献、语言构成和热门仓库。README 只需要一张 `<img>`，不需要 GitHub Actions 定时生成。

```html
<p align="center">
  <a href="https://profile.galgame.vip/?username=YOUR_LOGIN">
    <img width="100%" src="https://profile.galgame.vip/api?username=YOUR_LOGIN" alt="YOUR_LOGIN 的 GitHub 主页卡片">
  </a>
</p>
```

## 特点

- **一张动态卡片**：所有公开指标集中在一个 SVG 中，风格统一，自动刷新。
- **直接识别主页链接**：支持 `DearLicy`、`@DearLicy` 和 `https://github.com/DearLicy`。
- **五套视觉主题**：墨轨、校样、蓝图、海报、瑞士，分别采用轨道、编辑、终端、海报和网格构图，而不是简单换色。
- **可定制内容**：强调色、两行标题、简介、状态徽标、页脚备注和热门仓库展示。
- **受控图片库**：访客或管理员选择的图片会先在浏览器压缩为不超过 1 MB 的 WebP。管理员可以公开、下线或删除图片；游客上传默认进入待审核状态。图片库既可保存在本地卷，也可完整交给 Google Drive。
- **完整图片浏览**：前台使用侧边抽屉与瀑布流图片墙选图，后台使用完整尺寸灯箱预览。卡片通过 `bgImage` 引用公开图片，不再接受任意背景或头像 URL。
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

后台提供访问模式、默认外观、GitHub 数据连接、缓存维护和图片库管理。图片库支持管理员上传、公开/下线、删除与灯箱预览，并可通过“允许非管理员上传”控制游客投稿；游客上传默认不会直接公开。

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
| `GET /api/images` | 获取已公开图片库，供前台选图 |
| `POST /api/images` | 游客上传 WebP，需管理员开放投稿；默认进入待审核状态 |
| `GET /images/:id.webp` | 读取已公开图片；未公开图片仅管理员会话可访问 |
| `GET /api/site` | 当前实例的公开模式、默认用户与主题元数据 |
| `GET /api/health`、`/health` | 健康检查 |
| `GET /admin` | 中文管理后台 |
| `GET /admin/api/images` | 管理员读取完整图片库与统计 |
| `POST /admin/api/images` | 管理员上传图片并直接公开 |
| `PATCH /admin/api/images/:id` | 管理员公开、下线或修改图片名称 |
| `DELETE /admin/api/images/:id` | 管理员删除图片 |

### 查询参数

| 参数 | 示例 | 说明 |
| --- | --- | --- |
| `username` / `user` / `url` | `DearLicy` | GitHub 用户名、`@username` 或主页 URL |
| `theme` | `midnight` | `midnight`、`ivory`、`ocean`、`ember`、`graphite`，对应五种不同构图 |
| `accent` | `%23D6422E` | 六位十六进制强调色，`#` 需要 URL 编码 |
| `bgImage` | `98a4c823-...` | 图片库中已公开图片的 UUID；旧版 `bg`、`bgData`、`photo` 参数会被忽略 |
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
  'https://profile.galgame.vip/api?username=DearLicy&theme=ocean&accent=%235D86FF&bgTL=0.7&bgTR=0.2&bgBL=0.5&bgBR=0.1'
```

### 图片处理与图片库

- 前台只从实例图片库选择背景。管理员上传后立即公开；游客上传会先进入待审核状态，由管理员决定是否公开。
- 图片在**访客浏览器**中完成缩放和 WebP 压缩，单张最大 1 MB。原图不会上传到服务器，服务端只保存压缩后的结果。
- 默认使用本地存储时，图片文件保存在 `data/images/`，索引保存在 `data/image-library.json`；每张图片权限为 `0600`，目录权限为 `0700`。
- 启用 Google Drive 后，图片文件和 `profile-card-image-library.json` 索引都写入指定 Drive 文件夹。实例只缓存少量图片以降低延迟，不把图片副本写入本地磁盘。
- 公开图片通过 `/images/:id.webp` 以一年不可变缓存提供；未公开图片只允许管理员会话读取。
- SVG 生成时只读取已公开图片并内嵌为 data URI。删除或下线图片后，旧卡片下一次刷新会自动移除该背景。
- 不再支持背景图片 URL、头像 URL 或 `bgData` inline 数据。头像始终来自 GitHub 返回的数据，避免把服务端变成任意 URL 代理。

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

网关只需要把请求转发到 `127.0.0.1:3410`，并保留 `Host`、`X-Forwarded-Proto` 与 `X-Forwarded-Host`。图片上传请求体最大约 1 MB，Nginx 建议配置 `client_max_body_size 2m;`，否则可能返回 `413 Request Entity Too Large`。

### Google Drive 图片库

如果不想让图片落在服务器磁盘，可把 `IMAGE_STORAGE_DRIVER` 设为 `google-drive`。Drive 中会保存每张 `${uuid}.webp` 和一个 `profile-card-image-library.json` 索引；站点配置 `data/config.json` 仍保留在本地，用于保存访问模式、默认外观和加密后的 GitHub Token。

推荐使用 OAuth 桌面客户端生成 refresh token：

1. 在 Google Cloud Console 创建项目并启用 **Google Drive API**。
2. 创建 **OAuth 客户端 ID**，应用类型选择 **桌面应用**。
3. 在本机执行：

```bash
GOOGLE_DRIVE_CLIENT_ID="..." \
GOOGLE_DRIVE_CLIENT_SECRET="..." \
npm run google:drive:auth
```

命令会打开一次性授权页，在 `127.0.0.1` 接收回调，然后创建或复用名为 `Profile Card Image Library` 的 Drive 文件夹。凭据默认写入权限为 `0600` 的 `.env.google-drive`，不会打印到终端；确认后再合并到服务器 `.env`，并删除本地临时文件。

生成的配置包含：

```text
IMAGE_STORAGE_DRIVER=google-drive
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
```

也可以使用服务账号：把目标 Drive 文件夹共享给服务账号邮箱并授予编辑权限，然后将服务账号 JSON 做 base64 编码写入 `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64`，同时填写 `GOOGLE_DRIVE_FOLDER_ID`。服务账号方案不需要浏览器授权，适合长期无人值守的服务器。

切换前若本地已有图片，可先执行一次迁移。迁移会保留原 UUID、审核状态和创建时间，且不会删除本地文件：

```bash
IMAGE_STORAGE_DRIVER=google-drive \
GOOGLE_DRIVE_FOLDER_ID="..." \
GOOGLE_DRIVE_CLIENT_ID="..." \
GOOGLE_DRIVE_CLIENT_SECRET="..." \
GOOGLE_DRIVE_REFRESH_TOKEN="..." \
npm run google:drive:migrate
```

确认 Drive 中图片与索引正常后，再切换容器环境变量并清理本地图片。Google Drive 不可用时，图片库接口会返回 `503`，但站点配置和卡片数据仍可正常工作。

### 备份

本地图片存储模式需要备份整个 `data/` 目录：

- `data/config.json`：实例配置与加密后的 GitHub 凭据；恢复时必须继续使用相同的 `ADMIN_SECRET`，否则旧凭据无法解密。
- `data/image-library.json`：图片索引、来源、审核状态和尺寸信息。
- `data/images/`：图片库的 WebP 文件。

Google Drive 模式只需备份 Drive 文件夹中的 WebP 与 `profile-card-image-library.json`，同时单独备份本地的 `data/config.json`。恢复时保持 `ADMIN_SECRET` 不变，否则加密凭据无法解密。

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
  handlers/images.js  图片库公开上传、资源路由与管理员接口
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
  assets.js           图片校验、GitHub 头像读取与内嵌编码
server/
  site-store.mjs      文件持久化与加密凭据
  image-store.mjs     WebP 校验、本地图片文件与索引持久化
  google-drive-store.mjs  Google Drive 图片、索引、OAuth 与服务账号
  image-store-factory.mjs 按环境变量选择本地或 Drive 存储
  application.mjs     Node HTTP 适配与安全日志
  bootstrap.mjs       进程启动与优雅关闭
  vendor.mjs          Shoelace / Lit 静态资源
scripts/
  google-drive-auth.mjs        OAuth 授权与 Drive 文件夹初始化
  migrate-images-to-drive.mjs  本地图片库迁移
server.mjs            Node 入口
```

## 环境变量

| 变量 | 必填 | 作用 |
| --- | --- | --- |
| `ADMIN_SECRET` | 是 | 管理员登录与凭据加密密钥，至少 24 字符 |
| `GITHUB_TOKEN` | 否 | 服务端只读 GitHub Token |
| `ASSET_HOSTS` | 否 | 为 GitHub 头像追加受信任域名，逗号分隔 |
| `ALLOW_REMOTE_ASSET_FETCH` | 否 | 是否允许从默认头像白名单外的 HTTPS 主机读取 GitHub 头像，默认 `false` |
| `SITE_MODE` | 否 | 首次启动的 `public` / `private` 默认值 |
| `DEFAULT_USERNAME` | 否 | 首次启动的默认 GitHub 用户 |
| `PUBLIC_REPO_URL` | 否 | 前台右上角 GitHub 按钮的目标地址 |
| `DATA_DIR` | 否 | 持久化目录，Docker 中为 `/app/data` |
| `PORT` / `HOST` | 否 | 监听端口与地址 |
| `IMAGE_STORAGE_DRIVER` | 否 | `file`（默认）或 `google-drive` |
| `GOOGLE_DRIVE_FOLDER_ID` | Drive 模式必填 | Drive 文件夹 ID 或文件夹链接 |
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth 必填 | OAuth 桌面客户端 ID |
| `GOOGLE_DRIVE_CLIENT_SECRET` | OAuth 必填 | OAuth 桌面客户端密钥 |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | OAuth 必填 | 由授权脚本生成，仅保存在服务器环境 |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64` | 服务账号必填 | base64 编码的服务账号 JSON |
| `GOOGLE_DRIVE_SUBJECT` | 否 | Workspace 域委托时使用的用户邮箱 |

后台保存的配置会覆盖 `SITE_MODE`、`DEFAULT_USERNAME` 和 `PUBLIC_REPO_URL` 的初始值。

## 安全与隐私

- 不请求、不统计、不展示私有仓库。
- GitHub Token 不会出现在 HTML、SVG、JSON、日志或 Git 中。
- 请求日志不会记录用户名、图片标识、Token 等查询参数内容。
- 图片上传仅接受有效的 WebP，单张不超过 1 MB；游客上传默认待审核，并按 IP 限制为每小时 8 次。
- 管理后台 Cookie 使用 `HttpOnly`、`SameSite=Lax`，HTTPS 下自动启用 `Secure`。
- 所有写操作校验 Origin，并带有登录尝试限速。
- Docker 容器以非 root 用户运行，丢弃 Linux capabilities，根文件系统只读，仅 `/app/data` 和 `/tmp` 可写。
- Google OAuth refresh token、客户端密钥与服务账号私钥只从服务器环境读取，不写入日志、SVG、前端页面或仓库。
- 公开实例仍应遵守 GitHub API 规则；大规模使用建议配置只读 Token，并在反向代理层增加限速。

安全细节见 [`SECURITY.md`](SECURITY.md)。

## License

[MIT](LICENSE) © 2026 DearLicy
