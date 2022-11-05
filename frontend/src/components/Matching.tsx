import React, { useEffect, useState, useRef } from "react";
import {
    useNavigate,
    useLocation,
    NavigateFunction,
    useParams,
} from "react-router";
import { Link as RouterLink, LinkProps } from "react-router-dom";

import {
    Box,
    Button,
    Grid,
    Link,
    Typography,
    Breadcrumbs,
    makeStyles,
    useTheme,
    Container,
    IconButton,
} from "@material-ui/core";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { ArrowBack, ArrowForward } from "@material-ui/icons";
import CloseIcon from "@material-ui/icons/Close";
import FavoriteIcon from "@material-ui/icons/Favorite";
import H from "history";
import { useAuthContext } from "../context/AuthContext";

import { ImageResponse } from "../common/interfaces";
const useStyles = makeStyles({
    tableCell: {
        width: "80%",
        maxWidth: 0,
    },
    swipeButtons__right: {
        padding: "30px",
        color: "#76e2b3",
        backgroundColor: "#ffffe0",
    },
    swipeButtons__left: {
        padding: "30px",
        color: "#ec5e6f",
        backgroundColor: "#ffffe0",
    },
});

const Canvas: React.FC<{ size: number; image: ImageResponse | undefined }> = ({
    size,
    image,
}) => {
    const canvas = useRef<HTMLCanvasElement>(null);
    if (image != null && canvas.current != null) {
        const ctx = canvas.current.getContext("2d")!;
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 2;
        };
        img.src = image.image_url;
    }
    return (
        <Box width={size}>
            <canvas height={size} width={size} ref={canvas} />
        </Box>
    );
};

const Matching: React.FC = () => {
    const theme = useTheme();
    const classes = useStyles();
    const matches = useMediaQuery(theme.breakpoints.up("sm"));
    const history = useNavigate();
    const location = useLocation();
    const [images, setImages] = useState<ImageResponse[]>([]);
    const last = useRef<string>();
    const [index, setIndex] = useState(0);
    const params = new URLSearchParams(location.search);
    const [sort, setSort] = useState<string>(params.get("sort") || "id");
    const [order, setOrder] = useState<string>(params.get("order") || "asc");
    const param = useParams<{ id: string }>();
    const { user } = useAuthContext();
    const loadImages = (
        history: NavigateFunction,
        location: H.Location,
        images: ImageResponse[]
    ) => {
        params.set("count", "100");
        if (last.current) {
            params.set("id", last.current);
        }
        fetch(`/api/images?${params}`)
            .then((res: Response) => {
                if (res.ok) {
                    return res.json();
                }
                if (res.status === 401) {
                    history("/");
                    return;
                }
                throw new Error(res.statusText);
            })
            .then((data: ImageResponse[]) => {
                if (data.length === 0) {
                    return;
                }
                last.current = data[data.length - 1].id;
                const ids = new Set(
                    images.map((value: ImageResponse) => value.id)
                );
                setImages(
                    images.concat(
                        data.filter((value: ImageResponse) => {
                            return !ids.has(value.id);
                        })
                    )
                );
            })
            .catch((err: Error) => {
                window.console.error(err.message);
            });
    };
    useEffect(() => {
        if (location.search.length === 0) {
            return;
        }
        if (images.length > 0) {
            if (last.current && last.current === images[images.length - 1].id) {
                return;
            }
        }
        setIndex(Number(param.id));
        loadImages(history, location, images);
    }, []);
    useEffect(() => {
        if (last.current) {
            last.current = undefined;
        }
        setImages([]);
    }, [location]);

    const resetForm = () => {
        setSort("id");
        setOrder("asc");
    };
    useEffect(() => {
        const params = new URLSearchParams({ sort, order });
        const name = new URLSearchParams(location.search).get("name");
        if (name) {
            params.set("name", name);
        }
        if (`?${params}` !== location.search) {
            history(
                {
                    pathname: location.pathname,
                    search: params.toString(),
                },
                { replace: true }
            );
        }
    }, [sort, order, history, location]);
    useEffect(() => {
        console.log(index);
        if (index < images.length && index >= 0) {
            history(
                {
                    pathname: `/matching/${index}`,
                    search: location.search,
                },
                { replace: true }
            );
        }
        loadImages(history, location, images);
    }, [index]);

    const nextImage = () => {
        setIndex(index + 1);
    };
    const prevImage = () => {
        setIndex(index - 1);
    };
    const handlers = {
        NEXT_IMAGE: nextImage,
        PREV_IMAGE: prevImage,
        STATUS_1: async () => await updateStatus(1),
        STATUS_2: async () => await updateStatus(2),
        STATUS_3: async () => await updateStatus(3),
    };

    const current = (index: any): ImageResponse => {
        return images[index];
    };
    const updateStatus = async (status: number) => {
        const res: Response = await fetch(`/api/userimage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                uid: user?.uid,
                image_url: current(index).image_url,
                status: status,
            }),
        });
        if (res.ok) {
            nextImage();
        } else {
            console.error(res.status);
        }
    };

    const link = React.forwardRef<HTMLAnchorElement, Omit<LinkProps, "to">>(
        (props, ref) => {
            const to = {
                pathname: "/map",
                search: location.search,
            };
            return <RouterLink ref={ref} to={to} {...props} />;
        }
    );
    return (
        <Container fixed>
            <Box my={5}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link color="inherit" component={link}>
                        Map
                    </Link>
                    <Typography color="textPrimary">Image</Typography>
                </Breadcrumbs>
            </Box>
            <Grid container>
                <Grid item xs={12}>
                    <Grid container justifyContent="center">
                        <Canvas
                            size={matches ? 512 : 384}
                            image={current(index)}
                        />
                    </Grid>
                    <Grid container justifyContent="space-between">
                        <Box>
                            <Button onClick={() => prevImage()}>
                                <ArrowBack />
                            </Button>
                        </Box>
                        <Box>
                            <IconButton
                                className={classes.swipeButtons__left}
                                color="primary"
                                onClick={async () => await updateStatus(1)}
                            >
                                <CloseIcon fontSize="large" />
                            </IconButton>
                            <IconButton
                                className={classes.swipeButtons__right}
                                onClick={async () => await updateStatus(3)}
                            >
                                <FavoriteIcon fontSize="large" />
                            </IconButton>
                        </Box>
                        <Box>
                            <Button onClick={() => nextImage()}>
                                <ArrowForward />
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Matching;
