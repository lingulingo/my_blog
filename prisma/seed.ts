import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@linghan.local";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "灵寒谷管理员",
        email: adminEmail,
        passwordHash: await bcrypt.hash("admin123456", 10),
        role: Role.ADMIN,
        bio: "Default admin account for the demo blog system.",
      },
    });
  }

  const categories = [
    { name: "产品设计", slug: "product-design", description: "关于产品结构、体验与界面叙事。" },
    { name: "工程实践", slug: "engineering", description: "关于全栈开发、架构与部署。" },
    { name: "内容创作", slug: "content-creation", description: "关于写作流、内容运营与表达。" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const links = [
    {
      name: "Next.js",
      url: "https://nextjs.org",
      description: "The app framework powering this animated publishing experience.",
      avatar: "https://nextjs.org/favicon.ico",
      sortOrder: 1,
    },
    {
      name: "Prisma",
      url: "https://www.prisma.io",
      description: "SQLite-first data layer with an easy migration path to MySQL.",
      avatar: "https://www.prisma.io/favicon-32x32.png",
      sortOrder: 2,
    },
    {
      name: "Framer Motion",
      url: "https://www.framer.com/motion/",
      description: "Used for the homepage and content transitions.",
      avatar: "https://www.framer.com/images/favicons/favicon.png",
      sortOrder: 3,
    },
  ];

  for (const link of links) {
    await prisma.friendLink.upsert({
      where: { url: link.url },
      update: link,
      create: link,
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
  const engineering = await prisma.category.findUniqueOrThrow({ where: { slug: "engineering" } });

  const postSlug = "welcome-to-linghan-blog-demo";
  const existingPost = await prisma.post.findUnique({ where: { slug: postSlug } });

  if (!existingPost) {
    await prisma.post.create({
      data: {
        title: "欢迎来到灵寒谷的 blog",
        slug: postSlug,
        excerpt: "这是一篇演示文章，用来验证分类、RSS、SEO 与访问统计链路已经打通。",
        content:
          "<h2>系统已就绪</h2><p>现在你可以登录后台，发布文章，管理友情链接，并通过分类和搜索组织内容。</p><p>你也可以继续让我补标签页、专题页和更复杂的数据报表。</p>",
        tags: "系统, 演示, 发布",
        published: true,
        authorId: admin.id,
        categoryId: engineering.id,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
