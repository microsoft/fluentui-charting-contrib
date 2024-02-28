import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import styles from "./index.module.css";
import sidebars from "@site/sidebars";
const HeaderBanner = ():JSX.Element => {
  return (
    <>
      <div className={`container ${styles.headerImageContainer}`}>
        <img className={styles.headerImage} src={require("@site/static/img/img_header.png").default} />
      </div>
    </>
  );
};
export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <>
      <Layout
        title={`${siteConfig.title}`}
        description="Description will go into a meta tag in <head />"
      >
        <HeaderBanner/>
        <main>
          <HomepageFeatures />
        </main>
      </Layout>
      <div className={styles.bgGradient}></div>
    </>
  );
}
