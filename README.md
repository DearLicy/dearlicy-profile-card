<div align="center">

# 主页卡片

把 GitHub 主页变成一张实时更新、可以自由设计的动态 SVG 名片。

[在线使用](https://profile.galgame.vip/) · [部署到自己的服务器](#docker-部署) · [GitHub Stars](https://github.com/DearLicy/dearlicy-profile-card/stargazers)

`Next.js 16` · `React 19` · `shadcn/ui` · `Motion` · `SQLite` · `Docker`

</div>

---

## 能做什么

- 输入 GitHub 用户名、`@用户名` 或完整主页链接，直接生成一张实时更新的 SVG 卡片。
- 五套拥有独立构图和视觉语言的版式，不是简单换色。
- 支持主题色、标题、简介、状态文案、页脚、头部标识和四角背景透明度。
- Stars、社区评分、Followers、Repositories、贡献、语言构成和热门仓库全部动态读取。
- 前台媒体库支持完整比例预览、灯箱查看、分类筛选和浏览器内 WebP 压缩上传。
- 管理员可以审核投稿、公开或隐藏图片、调整分类、迁移图片到 Google Drive。
- 公开 API 与自用模式一键切换；需要时也可以只允许指定主页访问。
- 全站客户端路由切换、日夜模式、Tabs、弹窗和抽屉均使用统一过渡；日夜切换不改变布局。

## 嵌入 GitHub README

```html
<p align="center">
  <a href="https://profile.galgame.vip/c/YOUR_LOGIN">
    <img
      width="100%"
      src="https://profile.galgame.vip/api?username=YOUR_LOGIN&theme=midnight"
      alt="YOUR_LOGIN 的 GitHub 主页卡片"
    >
  </a>
</p>
```

把 `YOUR_LOGIN` 换成你的 GitHub 用户名即可。卡片会在访客打开 README 时重新读取公开数据，并继续使用服务器最近一次成功生成的缓存。

## 公开 API

### `GET /api`

生成 SVG 卡片。以下路径等价：

```text
/api
/api/card
/card.svg
/profile.svg
```

| 参数 | 说明 |
| --- | --- |
| `username` / `user` / `url` | GitHub 用户名、`@用户名` 或完整主页链接 |
| `theme` | `midnight`、`ivory`、`ocean`、`ember`、`graphite` |
| `accent` | 六位十六进制强调色，例如 `%23CBB9FF` |
| `bgImage` | 媒体库图片 UUID；SVG 会把 WebP 内联为 data URI |
| `mark` | 左上角标识 |
| `h1` / `h2` | 两行主标题 |
| `intro` | 简介 |
| `badge` | 状态徽标 |
| `note` | 页脚备注 |
| `bgTL` / `bgTR` / `bgBL` / `bgBR` | 四角透明度，`0` 到 `1` |
| `refresh=1` | 请求读取新快照，受冷却时间限制 |

```bash
curl -o card.svg \
  "http://127.0.0.1:3410/api?username=DearLicy&theme=ocean&accent=%235D86FF"
```

### 其他公开接口

| 路由 | 用途 |
| --- | --- |
| `GET /api/summary` | 返回 Stars、评分、排名等 JSON 摘要 |
| `GET /api/site` | 站点公开配置与主题目录 |
| `GET /api/images` | 已公开图片与分类 |
| `GET /images/:id.webp` | WebP 图片 |
| `GET /api/health` | 服务与 SQLite 健康检查 |

## Docker 部署

只需要一个环境变量 `ADMIN_PASSWORD`，长度至少 16 个字符。GitHub Token、Google OAuth
客户端与其余设置都在首次启动后通过 `/admin` 配置。

```bash
git clone https://github.com/DearLicy/dearlicy-profile-card.git
cd dearlicy-profile-card
cp .env.example .env

# 将随机生成的值写入 .env 的 ADMIN_PASSWORD
openssl rand -hex 32

mkdir -p data
docker compose up -d --build
curl http://127.0.0.1:3410/api/health
```

Compose 默认监听 `127.0.0.1:3410`，不包含反向代理。Nginx、宝塔或 Cloudflare 由部署者自行管理。
反向代理时需要保留 `Host`、`X-Forwarded-Host` 和 `X-Forwarded-Proto`。

上传图片在浏览器中先压缩到 1 MB 以内；如果 Nginx 仍拦截请求，建议设置：

```nginx
client_max_body_size 2m;
```

### 持久化

| 容器路径 | 内容 |
| --- | --- |
| `/data/profile-card.sqlite` | 站点配置、GitHub 数据快照、图片元数据和加密凭据 |
| `/data/images/` | 本地 WebP 图片 |

SQLite 使用 WAL 模式。建议备份整个 `data/` 目录；在线备份前也可以先短暂停止容器。

## 管理后台

打开 `/admin`，使用部署时设置的 `ADMIN_PASSWORD` 登录。

- **工作台**：查看站点状态、待完成配置与默认卡片。
- **主页与数据**：维护默认主页、访问范围、GitHub 只读 Token 与数据缓存。
- **媒体库**：完整比例瀑布流、真实灯箱、分类、审核、批处理与云端迁移。
- **默认样式**：五套主题、强调色、默认文案和四角背景透明度。
- **设置**：站点、GitHub 与 Google Drive 配置集中在三个标签页中。

## Google Drive

1. 在 Google Cloud Console 启用 **Google Drive API**。
2. 创建 **OAuth 2.0 Web 客户端**。
3. 在后台“设置 → Google Drive”里复制回调地址并加入 Authorized redirect URIs：

```text
https://profile.galgame.vip/admin/oauth/google/callback
```

4. 填写 Client ID、Client Secret，保存后点击“连接 Google Drive”。

授权使用 PKCE 与签名 state，只申请 Drive 文件权限。Client Secret 与 refresh token
使用由 `ADMIN_PASSWORD` 经 scrypt 派生密钥的 AES-256-GCM 加密保存在 SQLite。

## 本地开发

需要 Node.js 24。

```bash
npm install
ADMIN_PASSWORD=development-password-at-least-16 npm run dev
```

打开 `http://127.0.0.1:3410`。开发环境数据库和图片写入项目内 `data/`。

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 安全边界

- 不提供访客 GitHub 登录，GitHub OAuth 与生成卡片无关。
- GitHub Token 是可选只读凭据，只用于读取公开主页与仓库数据。
- 管理员 API 使用 HttpOnly Cookie、同源写请求校验和按 IP 哈希限流。
- 图片使用 UUID 地址；未公开图片只有管理员可以访问。
- 不接受任意背景 URL 或头像 URL，避免把实例变成 URL 代理。
- 生产密码、Token、Client Secret 与 refresh token 不写入仓库。

## License

[MIT](./LICENSE)
