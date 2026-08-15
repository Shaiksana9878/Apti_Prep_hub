import { Router, type IRouter } from "express";
import claudeRouter from "./claude";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(claudeRouter);

export default router;
