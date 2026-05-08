import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import booksRouter from "./books";
import libraryRouter from "./library";
import commentsRouter from "./comments";
import messagesRouter from "./messages";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(booksRouter);
router.use(libraryRouter);
router.use(commentsRouter);
router.use(messagesRouter);
router.use(storageRouter);

export default router;
