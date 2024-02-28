import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  imageURL: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Community driven',
    imageURL: require('@site/static/img/img_community_driven.png').default,
    description: (
      <>
        Charting library is built as a community driven project. There are extensive tests and guidance docs to ensure quality and collaborative development. The team is committed to help partners build their scenarios. Recent partner contributions include secondary y-axis and donut chart default colors..
      </>
    ),
  },
  {
    title: 'Built in accessibility',
    imageURL: require('@site/static/img/img_accessibility.png').default,
    description: (
      <>
        With design and dev working hand in hand, our data viz library has considered accessibility from day one. Our library is WCAG MAS C compliant, with built in accessible practices for easy implementation that can craft the best experience for everyone, everywhere.
      </>
    ),
  },
];

function Feature({title, imageURL, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={imageURL} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={`row ${styles.featureContainer}`}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
