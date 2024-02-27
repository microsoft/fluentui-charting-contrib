import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Heading from "@theme/Heading";

import styles from "./index.module.css";
import sidebars from "@site/sidebars";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div
        className="container"
        style={{ backgroundImage: "url(img/img_header.png)" }}
      >
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to={`/docs/${sidebars.tutorialSidebar[0]}`}
          >
            Getting Started 🚈
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <div className="container headerImage">
        <img src={require("@site/static/img/img_header.png").default} />
      </div>
      <div className={styles.buttons}>
        <Link
          className="button button--secondary button--lg"
          to={`/docs/${sidebars.tutorialSidebar[0]}`}
        >
          Getting Started 🚈
        </Link>
      </div>
      {/* <HomepageHeader /> */}
      <main>
        <HomepageFeatures />
      </main>
      {/* <footer>
        <div className={`container  ${styles.footer}`}>
          <img src={require("@site/static/img/img_footer.png").default} className={styles.footerImage} />
        </div>
      </footer> */}
    </Layout>
  );
}
