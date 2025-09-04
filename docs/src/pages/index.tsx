import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();
    return (
        <header className={clsx('hero', styles.heroBanner)}>
            <div className="container">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    marginBottom: '1rem'
                }}>
                    <img src="img/dockman.svg" alt="Dockman Logo" width="80" height="80"/>
                    <Heading as="h1" className="hero__title" style={{margin: 0}}>
                        Dockman
                    </Heading>
                </div>
                <p className="hero__subtitle" style={{fontSize: '1.1rem'}}>
                    A Docker management tool for users who want unfiltered access to their
                    Docker Compose files.
                </p>

                <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                    <video
                        width="1000"
                        height="450"
                        style={{maxWidth: '100%', height: 'auto'}}
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src="https://github.com/RA341/assets/releases/download/dockman/dockman-demo.mp4"
                                type="video/mp4"/>
                        Your browser does not support the video tag. This is a demo of Dockman.
                    </video>
                </div>
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg"
                        to="/docs/install/docker">
                        RTFM 📚
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function Home(): ReactNode {
    return (
        <Layout
            title="Dockman - Docker Management Tool"
            description="Yet another Docker Compose manager">
            <HomepageHeader/>
            <main>
                <HomepageFeatures/>
            </main>
        </Layout>
    );
}
