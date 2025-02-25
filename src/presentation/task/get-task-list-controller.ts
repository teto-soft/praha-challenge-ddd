import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {createMiddleware} from "hono/factory";
import {z} from "zod";
import {FindManyTasksUseCase} from "../../application/use-case/find-many-tasks-use-case";
import {createPostgresqlTaskRepository} from "../../infrastructure/repository/postgresql-task-repository";
import {getDatabase} from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    findManyTasksUseCase: FindManyTasksUseCase;
  };
};

export const getTaskListController = new Hono<Env>();

getTaskListController.get(
  "/tasks",
  zValidator(
    "query",
    z.object({ filter: z.string().optional() }),
    (result, c) => {
      if (!result.success) {
        return c.text("invalid query", 400);
      }

      return;
    },
  ),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const repository = createPostgresqlTaskRepository(database);
    const findManyTasksUseCase = new FindManyTasksUseCase(repository);
    context.set("findManyTasksUseCase", findManyTasksUseCase);

    await next();
  }),
  async (context) => {
    const query = context.req.valid("query");

    const payload = await context.var.findManyTasksUseCase.invoke({
      filter: query.filter,
    });
    return context.json(payload);
  },
);
