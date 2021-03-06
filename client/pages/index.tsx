import React from "react";
import { Grid } from "@material-ui/core";
import styled from "@emotion/styled";

const HomeContainer = styled.div`
  .hero {
    width: 100%;
    color: #333;
  }
  .title {
    margin: 0;
    width: 100%;
    padding-top: 80px;
    line-height: 1.15;
    font-size: 48px;
  }
  .title,
  .description {
    text-align: center;
  }
  .card {
    padding: 18px 18px 24px;
    margin: 16px;
    width: 220px;
    text-align: left;
    text-decoration: none;
    color: #434343;
    border: 1px solid #9b9b9b;
  }
  .card:hover {
    border-color: #067df7;
  }
  .card h3 {
    margin: 0;
    color: #067df7;
    font-size: 18px;
  }
  .card p {
    margin: 0;
    padding: 12px 0 0;
    font-size: 13px;
    color: #333;
  }
`;

const Home: React.FunctionComponent = () => {
  return (
    <Grid container justify="center">
      <HomeContainer>
        <h1 className="title">Welcome to Next.js!</h1>
        <p className="description">
          To get started, edit <code>client/pages/index.tsx</code> and save to
          reload.
        </p>

        <Grid container direction="column" alignItems="center">
          <a href="https://nextjs.org/docs" className="card">
            <h3>Documentation &rarr;</h3>
            <p>Learn more about Next.js in the documentation.</p>
          </a>
          <a href="https://nextjs.org/learn" className="card">
            <h3>Next.js Learn &rarr;</h3>
            <p>Learn about Next.js by following an interactive tutorial!</p>
          </a>
          <a
            href="https://github.com/zeit/next.js/tree/master/examples"
            className="card"
          >
            <h3>Examples &rarr;</h3>
            <p>Find other example boilerplates on the Next.js GitHub.</p>
          </a>
        </Grid>
      </HomeContainer>
    </Grid>
  );
};

export default Home;
