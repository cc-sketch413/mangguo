# 把站点部署到 Netlify（正式上线教程）

这份教程帮你把「芒果的发布站」从临时预览链接，搬到 Netlify 上正式对外发布。
Netlify 是免费、稳定的境外静态托管，不需要备案，适合放汉化作品站。

---

## 一、先搞清楚：你要做几步

我已经帮你准备好：
- ✅ `netlify.toml`（告诉 Netlify 怎么构建 Hexo）
- ✅ git 仓库初始化 + 首次提交（源码已提交，随时能推）

你只需要做：
1. 注册一个 **Netlify 账号**（用邮箱，免费）
2. 选下面 **方式 A（推荐）** 或 **方式 B（最简单）** 之一上线
3. （可选）绑定你的域名 mangguo413.com

---

## 二、方式 A：连接 GitHub（推荐，以后更新最省心）

适合你以后想「我改完，一键更新」的场景。

### 第 1 步：注册 GitHub + 建空仓库
1. 打开 https://github.com ，注册账号（如果已有，跳过注册）
2. 点右上角 **+** → **New repository**
3. 仓库名随便填，比如 `mangguo-site`，**不要勾选** "Add a README"
4. 点 **Create repository**，记下仓库地址（形如 `https://github.com/你的用户名/mangguo-site`）

### 第 2 步：把本地站点推到 GitHub
在电脑上打开这个站点文件夹里的终端（或让我帮你执行），运行：

```bash
cd 汉化发布站
git branch -M main
git remote add origin https://github.com/你的用户名/mangguo-site
git push -u origin main
```

> 推送时如果提示登录，按提示用浏览器登录你的 GitHub 即可。

### 第 3 步：Netlify 导入仓库
1. 打开 https://app.netlify.com ，用邮箱注册并登录
2. 点 **Add new site** → **Import an existing project**
3. 选 **GitHub**，授权 Netlify 访问你的仓库
4. 选中刚才的 `mangguo-site` 仓库
5. Netlify 会**自动读取** `netlify.toml`（我已经写好构建命令），直接点 **Deploy site**
6. 等 1~2 分钟构建完成，你会得到一个 `https://xxxxx.netlify.app` 的正式链接 ✅

以后更新：我改完站点后，你（或我）重新 push 一次，Netlify 自动重新部署，链接不变。

---

## 三、方式 B：拖拽上传（最简单，不用 git）

适合「先快速上线看看」的场景，不用 GitHub。

1. 打开 https://app.netlify.com/drop
2. 把站点文件夹里的 **`public` 文件夹**整个拖进网页
3. 等几秒，立刻得到一个正式链接 ✅

> 缺点：以后每次更新，都要重新把 `public` 拖一次。长期还是建议方式 A。

---

## 四、绑定你的域名 mangguo413.com（可选）

1. Netlify 里进入你的站点 → **Domain settings** → **Add a domain**
2. 输入 `mangguo413.com`（或 `www.mangguo413.com`）
3. Netlify 会给出两条 DNS 记录，去你的**域名注册商**（阿里云/腾讯云/Godaddy 等）后台，在域名解析里照抄添加
4. 等 DNS 生效（几分钟到几小时），`mangguo413.com` 就能访问了

绑定后记得回来告诉我，我会把 `_config.yml` 里的 `url` 同步成最终域名（影响 RSS 和分享卡片）。

---

## 五、常见问题

**Q：构建失败怎么办？**
多半是 Node 版本问题。我已经在 `netlify.toml` 里固定了 Node 20，一般不会出问题。真失败了把报错发我。

**Q：不想用 GitHub 账号？**
用方式 B（拖拽）就行，完全不需要 GitHub。

**Q：域名一定要现在绑吗？**
不用。先上线拿到 netlify.app 链接发粉丝，域名以后再绑也行。

**Q：Netlify 免费额度够吗？**
个人汉化站完全够。免费版每月 100GB 流量、300 分钟构建，绰绰有余。
