# 环奈连结 WebUI

[环奈连结 R / KCRR](https://github.com/SonderXiaoming/kanna_connection_redive_2) 的网页管理界面。前端由 Vue 3、Vite 和 Element Plus 构建；登录、数据与操作由 KCRR 插件提供的 FastAPI 服务处理。本仓库只包含前端，不能单独作为后端运行。

## 功能

- 查看公会战面板、预约与出刀记录。
- 管理公会成员、通知和会战相关操作。
- 查看 BOX、助战及竞技场信息。
- 管理自己的网页登录方式和 PCR 账号。

可使用的功能取决于 KCRR 后端版本、机器人所在群及当前账号权限。

## 部署

需要 Node.js 20、npm、已运行的 KCRR 后端，以及能够提供静态文件和反向代理的 Nginx。示例配置使用同一站点下的 `/kanna_connection/` 作为网页路径、`/kanna_connection/api/` 作为 API 路径。KCRR 默认在 `127.0.0.1:12139` 提供 API；如果你修改过后端监听地址或端口，也要同步修改 Nginx 配置。

1. 构建前端：

   ```sh
   git clone https://github.com/SonderXiaoming/kanna_connection_webui.git
   cd kanna_connection_webui
   npm ci
   npm run build
   ```

   静态文件输出到 `dist/`。如果从 [Releases](https://github.com/SonderXiaoming/kanna_connection_webui/releases) 下载打包文件，可解压 `kanna_connection_webui.tar.xz`，其中也包含 `dist/` 目录。

2. 将 `dist/` 放到服务器上，参考 [`deploy/nginx.conf.example`](deploy/nginx.conf.example) 配置 Nginx。把示例中的 `/var/www/kanna_connection_webui/dist/` 改为实际目录，并按需设置监听端口、域名和 HTTPS。重新加载 Nginx 后，访问 `http://你的服务器:12138/kanna_connection/`；如果使用 HTTPS 或不同端口，请使用相应地址。

3. 在 KCRR 插件的 `setting.py` 中，将 `WebSetting.web_public_url` 设为实际可访问的网页地址，例如 `https://example.com/kanna_connection`。这样机器人发出的登录链接才会指向正确位置。使用 HTTPS 时，也应将 `WebSetting.cookie_secure` 设为 `True`。

网页采用 Vue Router history 模式，直接打开或刷新子页面需要回退到 `index.html`；示例 Nginx 配置已包含此规则。网页和 API 应使用同一个站点，以便登录 Cookie 正常工作。不要把仅供内部使用的 `12139` API 端口直接暴露到公网。

## 登录

向机器人私聊发送 `网页端登录`，打开返回的单次登录链接。也可私聊发送 `设置网页密码 新密码` 设置独立的网页密码，之后在登录页用 QQ 号和该密码登录；这里不需要输入 QQ 密码。密码长度为 8 到 128 个字符。

如果登录链接跳转地址不对，检查后端的 `WebSetting.web_public_url`。如果页面能打开但登录或数据加载失败，检查浏览器网络请求中的 `/kanna_connection/api/` 是否正确转发到后端。

## 本地开发

先启动 KCRR 后端，再运行：

```sh
npm ci
npm run dev
```

开发服务器使用 `http://localhost:3141/kanna_connection/`，并把 `/kanna_connection/api` 请求代理到 `http://127.0.0.1:12139`。如果后端运行在其他地址，修改 `vite.config.ts` 中的代理目标。生产环境的 API 前缀可在构建前通过 `VITE_API_URL` 配置，默认值为 `/kanna_connection/api`；如需更改网页路径，还要同步修改 `vite.config.ts` 的 `base` 和 Nginx 路由。

```sh
npm run type-check   # 检查 TypeScript / Vue 类型
npm run build        # 类型检查并构建 dist/
npm run preview      # 本地预览构建产物
```

## 自动打包与发布

GitHub Actions 在推送、拉取请求和手动触发时执行 `npm ci`、类型检查与构建，并上传包含 `dist/` 的 `kanna_connection_webui.tar.xz` 和 SHA-256 校验文件。推送标签后，还会创建草稿 Release 并附上这两个文件；检查无误后可在 GitHub 上发布草稿。

例如，准备发布 `v1.0.0` 时，在已提交的代码上运行：

```sh
git tag v1.0.0
git push origin v1.0.0
```

下载后可用 `sha256sum -c kanna_connection_webui.tar.xz.sha256` 校验，再运行 `tar -xJf kanna_connection_webui.tar.xz` 解压。

## 相关项目

- [KCRR 后端与插件说明](https://github.com/SonderXiaoming/kanna_connection_redive_2)
- [本仓库](https://github.com/SonderXiaoming/kanna_connection_webui)
