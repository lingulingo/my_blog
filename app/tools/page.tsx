import type { Metadata } from "next";

import { ToolLab } from "@/components/toolbox/tool-lab";
import { absoluteUrl, siteName } from "@/lib/utils";

export const metadata: Metadata = {
  title: "工具库",
  description: "常用开发工具集合，支持实时输入与输出。",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: `${siteName()} 工具库`,
    description: "常用开发工具集合，支持实时输入与输出。",
    url: absoluteUrl("/tools"),
  },
};

export default function ToolsPage() {
  return <ToolLab />;
}

