import React from "react";
import Link, { LinkProps } from "next/link";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import {
  Box,
  Button,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  Typography
} from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import styled from "@emotion/styled";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useAdminCheck } from "../hooks";

const NavLinkContainer = styled.div`
  font-weight: bold;
  font-size: 1.1rem;

  &:hover {
    text-decoration: underline;
  }
`;

const NavLink: React.FunctionComponent<LinkProps> = ({
  children,
  ...props
}) => (
  <NavLinkContainer>
    <Link {...props}>
      <a style={{ textDecoration: "none", color: "inherit" }}>{children}</a>
    </Link>
  </NavLinkContainer>
);

const Nav: React.FunctionComponent = () => {
  const { data } = useQuery(gql`
    query ProfileQuery {
      profile {
        loggedName
      }
    }
  `);

  const isAdmin = useAdminCheck();

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const theme = useTheme();

  return (
    <React.Fragment>
      <Box p={[2]}>
        <IconButton onClick={() => setDrawerOpen(true)}>
          <MenuIcon />
        </IconButton>
      </Box>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box minWidth="300px">
          <Grid container direction="row-reverse">
            <IconButton onClick={() => setDrawerOpen(false)}>
              {theme.direction === "ltr" ? (
                <ChevronLeftIcon />
              ) : (
                <ChevronRightIcon />
              )}
            </IconButton>
          </Grid>
          <Divider />
          <Box p={[1]}>
            {data && data.profile ? (
              <Grid container direction="column">
                <Box p={[3]}>
                  <Typography variant="h6">
                    Hello, {data.profile.loggedName}
                  </Typography>
                  <Box my={[2]}>
                    <a href="/auth/logout">
                      <Button variant="contained" color="primary">
                        Logout
                      </Button>
                    </a>
                  </Box>
                </Box>
              </Grid>
            ) : (
              <Box p={[3]}>
                <Grid container direction="row" justify="space-between">
                  <NavLink href="/login">
                    <Button variant="contained" color="primary">
                      Login
                    </Button>
                  </NavLink>
                  <NavLink href="/signup">
                    <Button variant="contained" color="primary">
                      Signup
                    </Button>
                  </NavLink>
                </Grid>
              </Box>
            )}
          </Box>
          <Divider />
          <Box p={[3]}>
            <List>
              <ListItem>
                <NavLink href="/">Home</NavLink>
              </ListItem>
              {/* TODO:  add sidebar links here */}
            </List>
          </Box>
          {isAdmin ? (
            <React.Fragment>
              <Divider />
              <Box p={[3]}>
                <h2>Administration</h2>
                <List>
                  <ListItem>
                    <NavLink href="/admin/users">Users</NavLink>
                  </ListItem>
                </List>
              </Box>
            </React.Fragment>
          ) : null}
        </Box>
      </Drawer>
    </React.Fragment>
  );
};

export default Nav;
