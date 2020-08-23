import { Router } from 'express';
import { hasPermissionIn } from '../middlewares/permissions.middleware';
import EmployeeController from '../controllers/employee.controller';
import ObjectiveController from '../controllers/objective.controller';
import ScheduleController from '../controllers/schedule.controller';
import UserController from '../controllers/user.controller';

// interfaces

// controllers

class PrivateRoutes{

  constructor(private router: Router = Router()){}

  public routes(): Router{
    // test route: only requires authentication
    // this.router.get('/test', (req: Request, res: Response): Response => {
    //   return res.status(200).json('test OK!');
    // });

    // employee
    this.router.get('/employees', hasPermissionIn('list', 'employee'), EmployeeController.index);
    this.router.post('/employees',hasPermissionIn('create', 'employee'), EmployeeController.create);
    this.router.get('/employees/:id', hasPermissionIn('show', 'employee'), EmployeeController.show);
    this.router.patch('/employees/:id', hasPermissionIn('update', 'employee'), EmployeeController.update);
    this.router.delete('/employees/:id', hasPermissionIn('delete', 'employee'), EmployeeController.delete);

    // objective
    this.router.get('/objectives', hasPermissionIn('list', 'objective'), ObjectiveController.index);
    this.router.post('/objectives',hasPermissionIn('create', 'objective'), ObjectiveController.create);
    this.router.get('/objectives/:id', hasPermissionIn('show', 'objective'), ObjectiveController.show);
    this.router.patch('/objectives/:id', hasPermissionIn('update', 'objective'), ObjectiveController.update);
    this.router.delete('/objectives/:id', hasPermissionIn('delete', 'objective'), ObjectiveController.delete);

    // schedule
    this.router.get('/schedules', hasPermissionIn('list', 'schedule'), ScheduleController.index);
    this.router.post('/schedules',hasPermissionIn('create', 'schedule'), ScheduleController.create);
    this.router.get('/schedules/new', hasPermissionIn('create', 'schedule'), ScheduleController.newRecord);
    this.router.post('/schedules/create-period',hasPermissionIn('create', 'schedule'), ScheduleController.addPeriod);
    this.router.post('/schedules/add-shifts',hasPermissionIn('create', 'schedule'), ScheduleController.addShifts);
    this.router.get('/schedules/period/:id', hasPermissionIn('edit', 'schedule'), ScheduleController.getPeriod);
    this.router.patch('/schedules/period/:id', hasPermissionIn('edit', 'schedule'), ScheduleController.savePeriod);


    // user
    // this.router.post('/users', hasPermissionIn('create', 'user'), UserController.create);

    return this.router;
  }
}

const privateRoutes: PrivateRoutes = new PrivateRoutes();
export default privateRoutes.routes();
