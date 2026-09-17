# Cloudflare Pages 部署教程（换掉 Netlify）

为什么要换：Netlify 免费版每月只有 **300 分钟构建时间**，更新频繁时很容易用完（用完后部署会被跳过，站点不更新）。
Cloudflare Pages 免费版是 **每月 500 次构建、带宽不限**，对个人发布站完全够用，国内访问速度也更好。

---

## 一、注册 Cloudflare（约 2 分钟）

1. 打开 https://dash.cloudflare.com/sign-up
2. 填邮箱 + 密码，注册（**不需要**绑卡，不需要买域名）
3. 收邮件点验证链接，登录进后台

## 二、创建 Pages 项目并连上你的仓库（约 3 分钟）

1. 左侧菜单找到 **Workers & Pages** → 点 **Create** → 选 **Pages** 标签 → **Connect to Git**
2. 授权 GitHub：点 **Connect GitHub**，在弹出的页面里选择 **Only select repositories**，勾选 `cc-sketch413/mangguo`，然后 **Install & Authorize**
3. 回到 Cloudflare，选中仓库 `cc-sketch413/mangguo` → **Begin setup**
4. 填写构建配置（**照抄下面，别改**）：

| 配置项 | 填什么 |
|---|---|
| Project name | `mangguo413`（决定网址，会是 mangguo413.pages.dev） |
| Production branch | `master` |
| Framework preset | `None`（或 Hexo，都行） |
| Build command | `npm run build` |
| Build output directory | `public` |

5. 展开 **Environment variables (advanced)**，加一条：

| Variable name | Value |
|---|---|
| `NODE_VERSION` | `20` |

6. 点 **Save and Deploy**，等 1~3 分钟

看到 **Success** 就上线了，你会得到一个网址：

```
https://mangguo413.pages.dev
```

## 三、把网址发我（重要）

拿到 pages.dev 网址后告诉我，我会：

- 把站点配置里的网址（`_config.yml` 的 `url`）改成新域名 —— 这影响 RSS、站点地图、微信/QQ 分享卡片
- 更新站内说明文档和发布脚本
- 帮你把最新内容推上去

## 四、以后的更新方式

**双击「一键发布.bat」** 就行（脚本会把源码 push 到 GitHub，Cloudflare 检测到后自动重新构建，约 1 分钟生效）。

或者也可以只要在 GitHub 改动，Cloudflare 会自动部署 —— 和 Netlify 一样的体验，但不会再有额度问题。

## 五、自定义域名（可选）

如果你以后买了 `mangguo413.com`，在 Pages 项目里：

**Custom domains** → **Set up a custom domain** → 输入域名 → 按提示到域名商改 DNS。

注意：域名如果也是托管在 Cloudflare，会自动配好，最省事。

---

## 常见问题

**Q：构建失败了怎么办？**
在 Pages 项目里点最新一次部署 → 看构建日志。最常见的两个原因：① 忘了加 `NODE_VERSION=20`；② Build output directory 填错（必须是 `public`）。把日志截图发我。

**Q：Netlify 那边要删掉吗？**
不用删，留着当备份（旧网址还能访问旧版本）。等你确认 Cloudflare 上一切正常，想删再删。

**Q：粉丝的链接怎么办？**
新网址是 `mangguo413.pages.dev`，需要通知一下粉丝（微博发一条），或者把新链接替换到你在别处贴的地址。站内所有链接都是相对路径，换域名不影响。

**Q：会不会哪天又要钱？**
免费额度是 500 次构建/月 + 无限带宽。个人发布站远用不到这个量级。除非哪天流量特别大（比如几百万 PV），否则一直免费。
