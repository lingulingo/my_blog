# 灵寒谷的blog

一个可直接启动的全栈博客系统，默认使用 SQLite，预留 MySQL 配置，并包含：

- 注册 + 登录
- 富文本 / Markdown 写文章
- 图片上传 + 头像上传
- 评论 + 点赞互动
- 访问统计
- 友情链接管理
- 文章分类 + 搜索
- RSS + sitemap + robots + 页面 SEO
- 动画首页
- Docker 一键部署

## 快速开始

1. 复制环境变量

```bash
cp .env.example .env
```

2. 安装依赖并初始化数据库

```bash
npm install
npm run db:push
npm run db:seed
```

3. 启动开发环境

```bash
npm run dev
```

默认演示管理员账号：

- 邮箱: `admin@linghan.local`
- 密码: `admin123456`

## 已提供的后台能力

- 删除文章
- 管理员删除留言
- 管理友情链接（新增 / 隐藏 / 删除）
- 分类管理（新增 / 编辑 / 删除）
- 文章分类选择
- 文章广场分页
- 分类页分页
- 搜索关键词高亮
- 热门文章榜（全部 / 近 7 天 / 近 30 天）
- 文章广场排序（最新 / 最热 / 点赞最多）

## SEO 与内容发现

- `rss.xml`
- `sitemap.xml`
- `robots.txt`
- 首页、文章列表、分类页、文章详情页元信息

## Docker 一键部署

```bash
cp .env.example .env
docker compose up -d --build
```

默认让应用容器监听宿主机 `127.0.0.1:3000`，再由宿主机 `Nginx` 反向代理对外暴露 `80` 端口。

如果是服务器部署，建议将 `.env` 至少改成：

```env
DATABASE_URL="file:./prisma/blog.db"
AUTH_SECRET="替换为随机长字符串"
NEXTAUTH_URL="http://你的服务器IP"
SITE_URL="http://你的服务器IP"
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="no-reply@example.com"
SMTP_PASS="替换为 SMTP 密码"
SMTP_FROM="灵寒谷 <no-reply@example.com>"
```

例如：

```env
NEXTAUTH_URL="http://120.48.4.105"
SITE_URL="http://120.48.4.105"
```

如果你要启用“忘记密码”，还需要补齐 SMTP 相关环境变量。应用会在登录页提供“忘记密码”入口，并向用户绑定邮箱发送一次性重置链接。

启动后访问：

```text
http://你的服务器IP
```

服务器侧 Nginx 可直接使用 `nginx/default.conf` 作为站点配置模板，将其放到：

```bash
/etc/nginx/sites-available/blog-system
```

然后建立软链接并重载：

```bash
ln -sf /etc/nginx/sites-available/blog-system /etc/nginx/sites-enabled/blog-system
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## MySQL 预留

将 `.env` 中的数据库地址切到 MySQL，然后执行：

```env
DATABASE_URL="mysql://root:password@localhost:3306/blog_system"
```

然后重新执行：

```bash
npm run db:generate:mysql
npm run db:push:mysql
```
