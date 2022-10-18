import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Link as RouterLink, LinkProps, Route ,Routes } from "react-router-dom";
import {
    AppBar, Button, Container, Link, Toolbar, Typography,
    makeStyles, createStyles,
} from "@material-ui/core";

import Signin from "./components/Signin";
import Menu from "./components/Menu";
import Image from "./components/Image";
import Images from "./components/Images";
import Stats from "./components/Stats";

interface UserInfo {
    displayName: string
    email: string
    rawId: string
}

const useStyles = makeStyles(() => {
    return createStyles({
        title: {
            flexGrow: 1,
        },
    });
});

const App: React.FC = () => {
    const classes = useStyles();
    const [email, setEmail] = useState<string | null>(null);
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/userinfo");
                if (res.ok) {
                    const user: UserInfo = await res.json();
                    setEmail(user.email);
                }
            } catch (err) {
                window.console.error(err);
            }
        })();
    }, []);
    const onClickSignout = useCallback(() => {
        (async () => {
            try {
                const res = await fetch("/api/signout", { method: "POST" });
                if (res.ok) {
                    setEmail(null);
                }
            } catch (err) {
                window.console.error(err);
            }
        })();
    }, []);
    const button = email ? (
      <Button color="inherit" onClick={onClickSignout}>
        Sign out
      </Button>
    ) : null;
    const link = React.forwardRef<HTMLAnchorElement, Omit<LinkProps, "to">>(
        (props, ref) => <RouterLink ref={ref} to="/" {...props} />,
    );
    return (
      <BrowserRouter>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              <Link component={link} color="inherit">
                Dataset
              </Link>
            </Typography>
            {button}
          </Toolbar>
        </AppBar>
        <Container fixed>
          <Routes>
            <Route path="/" element={email ? <Menu /> :<Signin />}></Route>
            <Route path="/image/:id" element={<Image />}></Route>
            <Route path="/images" element={<Images />}></Route>
            <Route path="/stats" element={<Stats />}></Route>
          </Routes>
        </Container>
      </BrowserRouter>
    );
};

export default App;
