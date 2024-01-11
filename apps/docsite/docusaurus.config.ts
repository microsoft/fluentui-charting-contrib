import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const config: Config = {
  title: "FluentUI Charting Contrib Docsite",
  tagline: "MD docs related to FluentUI Charting library",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://microsoft.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/fluentui-charting-contrib/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "microsoft", // Usually your GitHub org/user name.
  projectName: "fluentui-charting-contrib", // Usually your repo name.
  deploymentBranch: "gh-pages",
  trailingSlash: false,
  staticDirectories: ["../../docs/assets", "static"],

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          path: "../../docs",
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   "https://github.com/microsoft/fluentui-charting-contrib/tree/main/packages/create-docusaurus/templates/shared/",
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  stylesheets: [
    {
      href: "https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css",
      type: "text/css",
      integrity:
        "sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM",
      crossorigin: "anonymous",
    },
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "FluentUI Charting",
      logo: {
        alt: "FluentUI Charting Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/microsoft/fluentui-charting-contrib",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Docs",
              to: "/docs/Fluent-React-Charting",
            },
          ],
        },
        {
          title: "FluentUI",
          items: [
            {
              label: "Public Developer Docsite",
              href: "https://aka.ms/fluentcharting",
            },
            {
              label: "Github",
              href: "https://github.com/microsoft/fluentui",
            },
          ],
        },
        {
          title: "FluentUI Charting Contrib",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/microsoft/fluentui-charting-contrib",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Microsoft`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    algolia: {
      appId: "XZ2D9M7V2V",

      apiKey: "dbef9c4c79e37ac05ce104dbd93faeec",

      indexName: "fluentui-charting-contrib",

      contextualSearch: false,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
