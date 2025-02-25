import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {createMiddleware} from "hono/factory";
import {z} from "zod";
import {getDatabase} from "../../libs/drizzle/get-database";
import {createPostgresqlTaskRepository} from "../../infrastructure/repository/postgresql-task-repository";
import {FindTaskUseCase} from "../../application/use-case/find-task-use-case";

type Env = {
  Variables: {
    findTaskUseCase: FindTaskUseCase;
  };
};

export const getTaskController = new Hono();

getTaskController.get(
  "/tasks/:id",
  zValidator("param", z.object({ id: z.string() }), (result, c) => {
    if (!result.success) {
      return c.text("invalid id", 400);
    }

    return;
  }),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const repository = createPostgresqlTaskRepository(database);
    const findTaskUseCase = new FindTaskUseCase(repository);
    context.set("findTaskUseCase", findTaskUseCase);

    await next();
  }),
  async (context) => {
    const param = context.req.valid("param");

    const payload = await context.var.findTaskUseCase.invoke(param);
    if (!payload) {
      return context.text("task not found", 404);
    }
    return context.json(payload);
  },
);
