import * as R from "ramda";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import React from "react";
import {
  Box,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  Typography,
  Button
} from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useAuthCheck, useAdminCheck } from "../hooks";

interface NavSectionProps {
  title: string;
}

const NavSection: React.FunctionComponent<NavSectionProps> = ({
  title,
  children
}) => {
  return (
    <React.Fragment>
      <ListItem>
        <Typography variant="h6">{title}</Typography>
      </ListItem>
      <Box mx={[3]}>
        <List>{children}</List>
      </Box>
    </React.Fragment>
  );
};

interface NavItemProps {
  title: string;
  to: string;
  active?: boolean;
}

const NavItem: React.FunctionComponent<NavItemProps> = ({
  title,
  to,
  active
}) => {
  return (
    <ListItem>
      <Typography
        color={active ? "textPrimary" : "textSecondary"}
        variant={active ? "h6" : "body1"}
        style={{ cursor: "pointer" }}
        onClick={() => Router.push(to)}
      >
        {title}
      </Typography>
    </ListItem>
  );
};

const Nav: React.FunctionComponent = () => {
  const profile = useAuthCheck();
  const isAdmin = useAdminCheck();

  const NAV_SECTIONS = [
    { title: "Main", items: [{ title: "Home", to: "/" }] },
    {
      title: "Administration",
      hide: !isAdmin,
      items: [{ title: "Users", to: "/accounts/admin/users" }]
    }
  ];

  const links = R.flatten(
    NAV_SECTIONS.map((section, i) =>
      section.items.map((item, j) => ({ i, j, to: item.to }))
    )
  );

  const { asPath } = useRouter();

  const match = links
    .filter(link => asPath.startsWith(link.to))
    .reduce(
      R.maxBy(link => link.to.length),
      links[0]
    );

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
            {profile ? (
              <Grid container direction="column">
                <Box p={[3]}>
                  <Typography variant="h6">
                    Hello, {profile.loggedName}
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
                  <Button
                    onClick={() => Router.push("/accounts/login")}
                    variant="contained"
                    color="primary"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => Router.push("/accounts/login")}
                    variant="contained"
                    color="primary"
                  >
                    Signup
                  </Button>
                </Grid>
              </Box>
            )}
          </Box>
          <Divider />
          <List>
            {NAV_SECTIONS.map((section, i) =>
              section.hide ? null : (
                <React.Fragment key={i}>
                  <NavSection title={section.title}>
                    {section.items.map((item, j) => (
                      <NavItem
                        key={j}
                        {...item}
                        active={i === match.i && j === match.j}
                      />
                    ))}
                  </NavSection>
                  <Divider />
                </React.Fragment>
              )
            )}
          </List>
        </Box>
      </Drawer>
    </React.Fragment>
  );
};

export default Nav;
