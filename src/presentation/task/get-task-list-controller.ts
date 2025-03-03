import {Hono} from "hono";
import {createMiddleware} from "hono/factory";
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
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const repository = createPostgresqlTaskRepository(database);
    const findManyTasksUseCase = new FindManyTasksUseCase(repository);
    context.set("findManyTasksUseCase", findManyTasksUseCase);

    await next();
  }),
  async (context) => {
    const payload = await context.var.findManyTasksUseCase.invoke();

    return context.json(payload);
  },
);
